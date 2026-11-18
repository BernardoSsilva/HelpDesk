import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useId } from "react";

type SelectFieldProps = {
  disabled?: boolean;
  /** Texto da opção vazia (ex.: "Todos"). Sem ele, não há opção vazia. */
  emptyLabel?: string;
  fullWidth?: boolean;
  label: string;
  minWidth?: number;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
  value: string;
};

/** Select do MUI já com label associado ao campo (acessível a leitores de tela). */
export default function SelectField({ disabled, emptyLabel, fullWidth, label, minWidth, onChange, options, required, value }: SelectFieldProps) {
  const id = useId();

  return (
    <FormControl disabled={disabled} fullWidth={fullWidth} required={required} size="small" sx={minWidth ? { minWidth } : undefined}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select id={id} label={label} labelId={`${id}-label`} value={value} onChange={(event) => onChange(event.target.value)}>
        {emptyLabel !== undefined ? <MenuItem value="">{emptyLabel}</MenuItem> : null}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
