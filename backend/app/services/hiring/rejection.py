"""Fixed, machine-readable rejection reasons.

A free-text box alone would give the candidate prose we cannot aggregate and HR
a blank page they will skip; the codes make the feedback both writable in one
tap and countable. The same codes are shown back to the candidate, so a
rejection tells them what to work on instead of ending in silence.
"""

from __future__ import annotations

REJECTION_REASONS: dict[str, str] = {
    "skill_kurang": "Skill inti belum memadai untuk posisi ini",
    "pengalaman_kurang": "Pengalaman relevan belum cukup",
    "lokasi": "Lokasi / kesediaan pindah tidak cocok",
    "gaji": "Ekspektasi gaji di luar anggaran",
    "posisi_terisi": "Posisi sudah terisi kandidat lain",
    "tidak_hadir": "Tidak hadir / tidak merespons undangan",
    "dokumen": "Dokumen atau syarat administratif tidak terpenuhi",
    "lainnya": "Alasan lain (tulis di catatan)",
}


def latest_rejection(events: list) -> dict | None:
    """The most recent transition INTO 'rejected', as {code, label}, or None.

    `reason_note` is HR's private note and is deliberately not returned — the
    code was written for the candidate to read; the note was not.
    """
    rejected = [e for e in events if e.to_status == "rejected" and e.reason_code]
    if not rejected:
        return None
    last = max(rejected, key=lambda e: e.created_at)
    return {"code": last.reason_code, "label": REJECTION_REASONS.get(last.reason_code, last.reason_code)}
