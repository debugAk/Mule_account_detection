import os
import joblib
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple
from backend.app.core.config import settings

class MLInferenceService:
    def __init__(self, model_path: str = settings.MODEL_PATH):
        self.model_path = model_path
        self.model = None
        self.is_loaded = False
        self.load_error = None
        self.model_version = "1.0.0-isolation-forest"
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            self.load_error = f"Model artifact not found at {self.model_path}"
            print(f"[MLInferenceService] {self.load_error}")
            return

        try:
            self.model = joblib.load(self.model_path)
            self.is_loaded = True
            print(f"[MLInferenceService] Successfully loaded Isolation Forest model from {self.model_path}")
        except Exception as e:
            self.load_error = f"Error loading model artifact: {str(e)}"
            print(f"[MLInferenceService] {self.load_error}")

    def extract_features(
        self,
        pass_through_ratio: float,
        tx_count: int,
        total_credit_inr: float,
        end_balance: float,
        unique_counterparties: int,
    ) -> np.ndarray:
        # Validate and clean inputs
        pt_clean = float(max(0.0, min(1.0, pass_through_ratio if not np.isnan(pass_through_ratio) else 0.0)))
        tx_clean = int(max(0, tx_count if not np.isnan(tx_count) else 0))
        cr_clean = float(max(0.0, total_credit_inr if not np.isnan(total_credit_inr) else 0.0))
        bal_clean = float(max(0.0, end_balance if not np.isnan(end_balance) else 0.0))
        cp_clean = int(max(0, unique_counterparties if not np.isnan(unique_counterparties) else 0))

        # Expected 5 features matching ml/train_mule_detector.py:
        # 1. pass_through_ratio
        # 2. log1p(tx_count)
        # 3. log1p(total_credit_inr)
        # 4. end_balance / (total_credit_inr + 1)
        # 5. log1p(unique_counterparties)
        feat1 = pt_clean
        feat2 = float(np.log1p(tx_clean))
        feat3 = float(np.log1p(cr_clean))
        feat4 = float(bal_clean / (cr_clean + 1.0))
        feat5 = float(np.log1p(cp_clean))

        return np.array([[feat1, feat2, feat3, feat4, feat5]], dtype=np.float64)

    def predict(
        self,
        pass_through_ratio: float,
        tx_count: int,
        total_credit_inr: float,
        end_balance: float,
        unique_counterparties: int,
    ) -> Dict[str, Any]:
        inference_time = datetime.utcnow().isoformat() + "Z"
        X = self.extract_features(
            pass_through_ratio,
            tx_count,
            total_credit_inr,
            end_balance,
            unique_counterparties,
        )

        features_dict = {
            "pass_through_ratio": float(X[0, 0]),
            "log_tx_count": float(X[0, 1]),
            "log_total_credit_inr": float(X[0, 2]),
            "balance_retention_ratio": float(X[0, 3]),
            "log_unique_counterparties": float(X[0, 4]),
        }

        if self.is_loaded and self.model is not None:
            try:
                # Raw score: lower means more anomalous in standard IsolationForest.
                # In scikit-learn, score_samples is the opposite of the anomaly score:
                # raw score in [-1, 0] where lower is anomaly.
                raw_score = float(self.model.score_samples(X)[0])
                prediction_label = int(self.model.predict(X)[0])  # -1 = anomaly, 1 = normal

                # Calibrate to 0-100 anomaly scale
                # Typical range for score_samples on this distribution is [-0.85, -0.40]
                # Map -0.85 (anomaly) -> 95, -0.40 (normal) -> 20
                normalized = min(1.0, max(0.0, (-raw_score - 0.40) / 0.45))
                ml_anomaly_score = int(round(20 + normalized * 75))

                return {
                    "ml_anomaly_score": ml_anomaly_score,
                    "is_anomaly": bool(prediction_label == -1),
                    "raw_score": raw_score,
                    "model_version": self.model_version,
                    "inference_timestamp": inference_time,
                    "features_used": features_dict,
                    "fallback_used": False,
                }
            except Exception as e:
                print(f"[MLInferenceService] Prediction error: {e}, falling back to statistical baseline.")

        # Deterministic statistical baseline fallback (no random numbers)
        # Higher pass-through and higher log-volume = higher anomaly
        fallback_score = int(round(
            (X[0, 0] * 50) +
            (min(1.0, X[0, 2] / 18.0) * 30) +
            (min(1.0, X[0, 1] / 12.0) * 20)
        ))
        fallback_score = max(0, min(100, fallback_score))

        return {
            "ml_anomaly_score": fallback_score,
            "is_anomaly": fallback_score >= 65,
            "raw_score": -0.5,
            "model_version": f"{self.model_version}-fallback",
            "inference_timestamp": inference_time,
            "features_used": features_dict,
            "fallback_used": True,
            "fallback_reason": self.load_error or "Inference pipeline fallback",
        }

ml_service = MLInferenceService()
