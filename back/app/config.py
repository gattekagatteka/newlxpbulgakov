from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_alg: str = "HS256"
    jwt_expires_minutes: int = 720
    cors_origins: str = "http://localhost:3000"
    seed_on_start: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
