from unittest.mock import MagicMock

import httplib2
import pytest
from googleapiclient.errors import HttpError

from src.infrastructure import gmail_adapter
from src.infrastructure.gmail_adapter import GmailSendError, send_email


def http_error(status, reason="error"):
    resp = httplib2.Response({'status': status})
    return HttpError(resp, f'{{"error": {{"message": "{reason}"}}}}'.encode())


def service_with(*outcomes):
    """Gmail service palsu: setiap execute() mengembalikan / melempar outcome berikutnya."""
    service = MagicMock()
    execute = service.users.return_value.messages.return_value.send.return_value.execute
    execute.side_effect = list(outcomes)
    return service, execute


def test_success_first_try():
    service, execute = service_with({'id': 'abc'})
    send_email(service, {'raw': 'x'}, sleep=lambda s: None)
    assert execute.call_count == 1


def test_retries_transient_error_then_succeeds():
    service, execute = service_with(http_error(503), {'id': 'abc'})
    sleeps = []
    send_email(service, {'raw': 'x'}, sleep=sleeps.append)
    assert execute.call_count == 2
    assert sleeps == [gmail_adapter.BACKOFF_SECONDS[0]]


def test_gives_up_after_max_attempts():
    service, execute = service_with(*[http_error(500)] * gmail_adapter.MAX_ATTEMPTS)
    with pytest.raises(GmailSendError) as exc:
        send_email(service, {'raw': 'x'}, sleep=lambda s: None)
    assert execute.call_count == gmail_adapter.MAX_ATTEMPTS
    assert not exc.value.quota_exceeded


def test_does_not_retry_bad_request():
    service, execute = service_with(http_error(400, "Invalid To header"))
    with pytest.raises(GmailSendError):
        send_email(service, {'raw': 'x'}, sleep=lambda s: None)
    assert execute.call_count == 1


def test_daily_quota_is_flagged_and_not_retried():
    service, execute = service_with(http_error(429, "Daily user sending limit exceeded"))
    with pytest.raises(GmailSendError) as exc:
        send_email(service, {'raw': 'x'}, sleep=lambda s: None)
    assert exc.value.quota_exceeded
    assert execute.call_count == 1


def test_retries_connection_error():
    service, execute = service_with(ConnectionResetError("reset"), {'id': 'abc'})
    send_email(service, {'raw': 'x'}, sleep=lambda s: None)
    assert execute.call_count == 2
