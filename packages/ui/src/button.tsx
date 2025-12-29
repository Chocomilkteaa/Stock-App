import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';

export interface RepoButtonProps extends ButtonProps {
  label: string;
}

export const RepoButton = ({ label, ...props }: RepoButtonProps) => {
  return (
    <Button variant="contained" {...props}>
      {label}
    </Button>
  );
};
