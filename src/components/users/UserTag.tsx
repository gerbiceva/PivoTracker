import { Button } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { numToColor } from "./stringToCol";

interface IUserInterfaceProps {
  fullname: string;
  id: number;
}

export const UserTag = ({ fullname, id }: IUserInterfaceProps) => {
  const navigate = useNavigate();
  return (
    <Button
      color={numToColor(id)}
      variant="subtle"
      onClick={() => {
        navigate(`/user/${id}`);
      }}
      leftSection={
        // <Avatar size="sm" color={numToColor(id)} variant="outline">
        //   {fullname.toUpperCase().charAt(0)}
        // </Avatar>
        <IconUser />
      }
    >
      {fullname.charAt(0).toUpperCase() + fullname.slice(1)}
    </Button>
  );
};
