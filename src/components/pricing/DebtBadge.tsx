import { Badge, BadgeProps } from "@mantine/core";
import { numberToEur } from "../../utils/Converter";

interface IDebtBadgeProps extends BadgeProps {
  debt: number;
}

export const DebtBadge = ({ debt, ...other }: IDebtBadgeProps) => {
  return (
    <Badge
      variant="light"
      radius="sm"
      size="lg"
      color={debt == 0.0 ? "gray" : debt < 0 ? "green" : "red"}
      {...other}
    >
      {numberToEur(debt)} €
    </Badge>
  );
};
