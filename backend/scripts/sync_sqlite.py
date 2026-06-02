import asyncio
import json
from pathlib import Path
from backend.app.config.settings import settings
from backend.app.api.database import async_session_factory, reconfigure
from backend.app.api.models import User
from sqlalchemy.future import select

async def sync():
    reconfigure(settings.effective_database_url)
    async with async_session_factory() as db:
        for p in Path('data/users').glob('*.json'):
            data = json.loads(p.read_text('utf-8'))
            stmt = select(User).where(User.email == data['email'])
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                u = User(id=data['id'], email=data['email'], name=data['email'].split('@')[0], password_hash=data['password_hash'], role=data['role'], is_active=True)
                db.add(u)
        await db.commit()
    print("Sync complete")

asyncio.run(sync())
