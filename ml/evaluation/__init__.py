try:
    from ml.evaluation.evaluate import evaluate_inversion_model
except ImportError:
    from .evaluate import evaluate_inversion_model

__all__ = ["evaluate_inversion_model"]

