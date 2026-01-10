import { Button, type ButtonProps } from '@mui/material';

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
