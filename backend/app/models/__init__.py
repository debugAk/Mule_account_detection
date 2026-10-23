from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class AccountModel(Base):
    __tablename__ = "accounts"

    id = Column(String(64), primary_key=True)  # e.g. HDFC-XXXX9416
    raw_account_no = Column(String(64), nullable=True)
    account_holder_masked = Column(String(128), default="R*** K***")
    bank_name = Column(String(128), default="HDFC Bank")
    ifsc = Column(String(32), default="HDFC0001245")
    upi_handle_masked = Column(String(128), default="user@hdfc")
    risk_score = Column(Integer, default=50)
    risk_tier = Column(String(16), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    pass_through_ratio = Column(Float, default=0.0)
    graph_degree = Column(Integer, default=0)
    account_age_days = Column(Integer, default=30)
    amount_at_risk_inr = Column(Float, default=0.0)
    status = Column(String(32), default="ACTIVE")  # ACTIVE, FROZEN, UNDER_REVIEW, DISMISSED
    total_credit_inr = Column(Float, default=0.0)
    total_debit_inr = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    is_restricted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    alerts = relationship("AlertModel", back_populates="account")

class TransactionModel(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    source_account = Column(String(64), nullable=False, index=True)
    destination_account = Column(String(64), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(8), default="INR")
    channel = Column(String(32), default="UPI")  # UPI, IMPS, NEFT, RTGS, ATM
    narration = Column(String(255), default="")
    is_flagged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_tx_pair", "source_account", "destination_account"),
    )

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True)  # e.g. ALT-88102
    account_id = Column(String(64), ForeignKey("accounts.id"), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)
    risk_tier = Column(String(16), nullable=False)
    queue_category = Column(String(32), default="ALL")  # MY_QUEUE, HIGH_RISK, RINGS, NEW_TODAY, ALL
    signals = Column(JSON, default=list)
    status = Column(String(32), default="NEW")  # NEW, INVESTIGATING, ESCALATED, DISMISSED, FROZEN
    assigned_to = Column(String(64), nullable=True)
    ring_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("AccountModel", back_populates="alerts")

class CaseModel(Base):
    __tablename__ = "cases"

    id = Column(String(64), primary_key=True)  # e.g. CAS-2026-1001
    alert_id = Column(String(64), ForeignKey("alerts.id"), nullable=True)
    primary_account = Column(String(64), nullable=False)
    primary_holder_masked = Column(String(128), default="R*** K***")
    bank_name = Column(String(128), default="HDFC Bank")
    ifsc = Column(String(32), default="HDFC0001245")
    title = Column(String(255), nullable=False)
    risk_score = Column(Integer, default=75)
    status = Column(String(32), default="OPEN")  # OPEN, UNDER_REVIEW, STR_SUBMITTED, CLOSED
    assigned_analyst = Column(String(64), default="ANALYST-104")
    sla_deadline = Column(DateTime, nullable=True)
    total_exposed_inr = Column(Float, default=0.0)
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NoteModel(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String(64), nullable=True, index=True)
    account_id = Column(String(64), nullable=True, index=True)
    author = Column(String(64), default="ANALYST-104")
    content = Column(Text, nullable=False)
    tag = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditModel(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    audit_id = Column(String(64), unique=True, index=True)
    action = Column(String(64), nullable=False)
    actor_id = Column(String(64), default="SYSTEM")
    target_id = Column(String(128), default="")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class CsvImportModel(Base):
    __tablename__ = "csv_imports"

    id = Column(String(64), primary_key=True)
    filename = Column(String(255), nullable=False)
    file_format = Column(String(32), default="TRANSACTIONS_CSV")
    total_rows = Column(Integer, default=0)
    accepted_rows = Column(Integer, default=0)
    rejected_rows = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)
    created_alerts_count = Column(Integer, default=0)
    error_summary = Column(JSON, default=list)
    imported_by = Column(String(64), default="ANALYST-104")
    created_at = Column(DateTime, default=datetime.utcnow)
