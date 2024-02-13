import { Badge, BadgeProps } from "@mantine/core";
import { numberToEur, pivoVGajba } from "../../utils/Converter";

interface IDebtBadgeProps extends BadgeProps {
  ordered: number;
  paid: number;
}

export const DebtBadge = ({ ordered, paid, ...other }: IDebtBadgeProps) => {
  const debt = pivoVGajba(ordered, paid / 10);
  return (
    <Badge
      variant="light"
      radius="sm"
      size="lg"
      color={debt == 0.0 ? "gray" : debt < 0 ? "green" : "red"}
      {...other}
    >
      {numberToEur(debt)}
    </Badge>
  );
};
