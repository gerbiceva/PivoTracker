import { Button } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { stringToColor } from '../../utils/colorUtils';

interface IUserInterfaceProps {
  fullname: string;
  id: string;
}

export const UserTag = ({ fullname, id }: IUserInterfaceProps) => {
  const navigate = useNavigate();
  return (
    <Button
      color={stringToColor(id)}
      variant="subtle"
      onClick={() => {
        navigate(`/user/${id}`);
      }}
      leftSection={<IconUser />}
    >
      {fullname.charAt(0).toUpperCase() + fullname.slice(1)}
    </Button>
  );
};
