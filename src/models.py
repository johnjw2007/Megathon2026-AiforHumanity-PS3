"""Model definitions for the drone detector."""
import torch
import torch.nn as nn

class BaselineLogistic(torch.nn.Module):
    """Logistic regression on flattened log-magnitude + phase features.

    Used as a classical ML baseline through sklearn, but here as a torch
    reference for parity.
    """
    def __init__(self, input_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 1),
            nn.Flatten(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (N, T, C) -> flatten
        x = x.view(x.size(0), -1)
        return self.net(x)


class DroneCNN(nn.Module):
    """Compact 1D CNN for fixed-length complex baseband windows.

    Input: (N, T, C) with C=3 (log_magnitude, cos(phase), sin(phase)) after
    our preprocessing. Architecture follows the requested compact design.
    """
    def __init__(self, seq_len: int = 150, n_channels: int = 3, dropout: float = 0.3):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv1d(n_channels, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Conv1d(32, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
        )
        self.head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
            nn.Flatten(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (N, T, C) -> (N, C, T) for Conv1d
        x = x.permute(0, 2, 1)
        x = self.backbone(x)
        logits = self.head(x)
        return logits

class DroneCNNv2(nn.Module):
    """Compact 1D CNN for fixed-length complex baseband windows with configurable channels.

    Uses log-magnitude and phase channels to preserve temporal structure.
    """
    def __init__(self, seq_len: int = 150, n_channels: int = 3, dropout: float = 0.3):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv1d(n_channels, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Conv1d(32, 32, kernel_size=5, padding=2),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
            nn.Flatten(),
        )
        self.head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
            nn.Flatten(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (N, T, C) -> (N, C, T) for Conv1d
        x = x.permute(0, 2, 1)
        x = self.backbone(x)
        logits = self.head(x)
        return logits

def model_param_count(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters())
