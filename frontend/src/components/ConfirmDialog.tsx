import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

type ConfirmDialogProps = {
  confirmLabel?: string;
  description: string;
  /** Destaca a ação como destrutiva (botão vermelho). */
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export default function ConfirmDialog({
  confirmLabel = "Confirmar",
  description,
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onCancel}>
          Cancelar
        </Button>
        <Button autoFocus color={destructive ? "error" : "primary"} disabled={loading} variant="contained" onClick={onConfirm}>
          {loading ? "Aguarde..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
