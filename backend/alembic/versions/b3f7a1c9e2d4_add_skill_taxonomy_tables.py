"""Add skill/occupation taxonomy tables

Revision ID: b3f7a1c9e2d4
Revises: 9a1b2c3d4e5f
Create Date: 2026-09-05

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b3f7a1c9e2d4"
down_revision: Union[str, Sequence[str], None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "skills",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("canonical_name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default=""),
        sa.Column("aliases", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("skkni_unit_code", sa.String(length=30), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("canonical_name"),
    )
    op.create_index(op.f("ix_skills_canonical_name"), "skills", ["canonical_name"], unique=True)

    op.create_table(
        "occupations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("kbji_code", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("kbji_code"),
    )
    op.create_index(op.f("ix_occupations_kbji_code"), "occupations", ["kbji_code"], unique=True)

    op.create_table(
        "occupation_skills",
        sa.Column("occupation_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("min_level", sa.String(length=20), nullable=False, server_default="intermediate"),
        sa.Column("is_core", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["occupation_id"], ["occupations.id"]),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.PrimaryKeyConstraint("occupation_id", "skill_id"),
    )

    op.create_table(
        "seeker_skills",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seeker_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("level", sa.String(length=20), nullable=False, server_default="intermediate"),
        sa.Column("years", sa.Float(), nullable=False, server_default="0"),
        sa.Column("verified_via", sa.String(length=30), nullable=False, server_default="self_report"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["seeker_id"], ["seekers.id"]),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("seeker_id", "skill_id", name="uq_seeker_skill"),
    )
    op.create_index(op.f("ix_seeker_skills_seeker_id"), "seeker_skills", ["seeker_id"], unique=False)
    op.create_index(op.f("ix_seeker_skills_skill_id"), "seeker_skills", ["skill_id"], unique=False)

    op.create_table(
        "job_skill_requirements",
        sa.Column("job_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("min_level", sa.String(length=20), nullable=False, server_default="intermediate"),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["job_id"], ["jobs.id"]),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.PrimaryKeyConstraint("job_id", "skill_id"),
    )

    op.create_table(
        "skill_demand_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("region_code", sa.String(length=50), nullable=False),
        sa.Column("period", sa.String(length=10), nullable=False),
        sa.Column("demand_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("supply_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_salary_offered", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("skill_id", "region_code", "period", name="uq_skill_demand_period"),
    )
    op.create_index(op.f("ix_skill_demand_snapshots_skill_id"), "skill_demand_snapshots", ["skill_id"], unique=False)
    op.create_index(op.f("ix_skill_demand_snapshots_region_code"), "skill_demand_snapshots", ["region_code"], unique=False)
    op.create_index(op.f("ix_skill_demand_snapshots_period"), "skill_demand_snapshots", ["period"], unique=False)

    op.create_table(
        "learning_actions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seeker_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("course_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="planned"),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["seeker_id"], ["seekers.id"]),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_learning_actions_seeker_id"), "learning_actions", ["seeker_id"], unique=False)

    op.create_table(
        "regional_minimum_wages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("region_code", sa.String(length=50), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("umr_amount", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("region_code", "year", name="uq_umr_region_year"),
    )
    op.create_index(op.f("ix_regional_minimum_wages_region_code"), "regional_minimum_wages", ["region_code"], unique=False)

    op.create_table(
        "skill_assessments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("questions", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("passing_score", sa.Float(), nullable=False, server_default="0.7"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("skill_id"),
    )

    op.create_table(
        "seeker_skill_assessment_attempts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("seeker_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=36), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["seeker_id"], ["seekers.id"]),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_seeker_skill_assessment_attempts_seeker_id"),
        "seeker_skill_assessment_attempts", ["seeker_id"], unique=False,
    )
    op.create_index(
        op.f("ix_seeker_skill_assessment_attempts_skill_id"),
        "seeker_skill_assessment_attempts", ["skill_id"], unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("seeker_skill_assessment_attempts")
    op.drop_table("skill_assessments")
    op.drop_index(op.f("ix_regional_minimum_wages_region_code"), table_name="regional_minimum_wages")
    op.drop_table("regional_minimum_wages")
    op.drop_index(op.f("ix_learning_actions_seeker_id"), table_name="learning_actions")
    op.drop_table("learning_actions")
    op.drop_index(op.f("ix_skill_demand_snapshots_period"), table_name="skill_demand_snapshots")
    op.drop_index(op.f("ix_skill_demand_snapshots_region_code"), table_name="skill_demand_snapshots")
    op.drop_index(op.f("ix_skill_demand_snapshots_skill_id"), table_name="skill_demand_snapshots")
    op.drop_table("skill_demand_snapshots")
    op.drop_table("job_skill_requirements")
    op.drop_index(op.f("ix_seeker_skills_skill_id"), table_name="seeker_skills")
    op.drop_index(op.f("ix_seeker_skills_seeker_id"), table_name="seeker_skills")
    op.drop_table("seeker_skills")
    op.drop_table("occupation_skills")
    op.drop_index(op.f("ix_occupations_kbji_code"), table_name="occupations")
    op.drop_table("occupations")
    op.drop_index(op.f("ix_skills_canonical_name"), table_name="skills")
    op.drop_table("skills")
