import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
from typing import Tuple


class AnomalyDetector:
    """
    Multi-model ensemble for thermal/environmental anomaly detection.

    Models:
    1. Isolation Forest
    2. Local Outlier Factor
    """

    def __init__(self, contamination: float = 0.05):
        self.iso_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )

        self.lof = LocalOutlierFactor(
            n_neighbors=20,
            contamination=contamination,
            novelty=True
        )

        self.scaler = StandardScaler()

    def fit(self, X: np.ndarray) -> None:
        """Fit the anomaly detection models."""
        X_scaled = self.scaler.fit_transform(X)

        self.iso_forest.fit(X_scaled)
        self.lof.fit(X_scaled)

    def predict(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Detect anomalies.

        Returns:
            predictions: -1 for anomaly, 1 for normal
            scores: normalized ensemble anomaly score
        """
        X_scaled = self.scaler.transform(X)

        iso_scores = -self.iso_forest.score_samples(X_scaled)
        lof_scores = -self.lof.score_samples(X_scaled)

        iso_scores = self._normalize(iso_scores)
        lof_scores = self._normalize(lof_scores)

        ensemble_scores = (iso_scores + lof_scores) / 2

        predictions = np.where(ensemble_scores > 0.5, -1, 1)

        return predictions, ensemble_scores

    @staticmethod
    def _normalize(scores: np.ndarray) -> np.ndarray:
        """Normalize scores to [0, 1]."""
        min_score = scores.min()
        max_score = scores.max()

        return (scores - min_score) / (max_score - min_score + 1e-9)