from fastapi import APIRouter
from fastapi.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from app.core.config import config
from app.infrastructure.google_auth import check_token_status, save_credentials

router = APIRouter()

# Redirect URI yang terdaftar di Google Cloud Console
# Harus sama persis dengan yang ada di credentials.json → redirect_uris
REDIRECT_URI = f"{config.BACKEND_URL}/api/auth/google/callback"

# Simpan Flow object sementara di memori agar code_verifier (PKCE) tidak hilang
# saat callback dipanggil.
_auth_flows = {}


def _build_flow() -> Flow:
    """Buat Flow object dari credentials.json."""
    flow = Flow.from_client_secrets_file(
        config.CREDENTIALS_PATH,
        scopes=config.SCOPES,
        redirect_uri=REDIRECT_URI,
    )
    return flow


@router.get("/auth/google/status", tags=["Google Auth"])
async def auth_status():
    """
    Cek apakah token Google saat ini valid.
    Gunakan endpoint ini di frontend untuk menampilkan status koneksi Gmail.
    """
    status = check_token_status()
    return status


@router.get("/auth/google/login", tags=["Google Auth"])
async def auth_login():
    """
    Mulai alur OAuth Google. Redirect user ke halaman consent Google.
    Buka endpoint ini di browser untuk (re)autentikasi.
    """
    flow = _build_flow()
    auth_url, state = flow.authorization_url(
        access_type="offline",   # Minta refresh_token agar bisa auto-refresh
        include_granted_scopes="true",
        prompt="consent",        # Paksa tampilkan consent screen agar selalu dapat refresh_token
    )
    
    # Simpan flow ini di memori agar bisa dipakai saat callback
    _auth_flows[state] = flow
    
    return RedirectResponse(url=auth_url)


@router.get("/auth/google/callback", tags=["Google Auth"])
async def auth_callback(code: str, state: str = None, error: str = None):
    """
    Callback dari Google setelah user approve OAuth consent.
    Google akan redirect ke sini dengan ?code=... yang kemudian ditukar menjadi token.
    """
    if error:
        # Redirect ke frontend halaman login dengan pesan error
        return RedirectResponse(url=f"{config.FRONTEND_URL}/login?error={error}")

    try:
        # Ambil kembali flow yang sama persis (yang memiliki code_verifier)
        flow = _auth_flows.get(state)
        if not flow:
            raise Exception("Session login kadaluwarsa atau tidak valid. Silakan coba login lagi.")
            
        flow.fetch_token(code=code)
        
        # Bersihkan memori setelah berhasil
        del _auth_flows[state]
        
        creds = flow.credentials
        save_credentials(creds)

        # Redirect ke dashboard setelah sukses login
        return RedirectResponse(url=f"{config.FRONTEND_URL}/dashboard?auth=success")
    except Exception as e:
        print("ERROR IN AUTH CALLBACK:", str(e))
        import traceback
        traceback.print_exc()
        return RedirectResponse(url=f"{config.FRONTEND_URL}/login?error=Failed_to_save_token")
