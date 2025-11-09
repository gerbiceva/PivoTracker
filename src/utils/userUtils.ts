import { userType } from '../components/users/userType';

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export const baseUserToString = (user: userType) => {
  if (!user || !user.name || !user.surname) {
    return '/';
  }
  return (
    capitalizeFirstLetter(user.name.toLocaleLowerCase()) +
    ' ' +
    capitalizeFirstLetter(user.surname.toLocaleLowerCase()) +
    ' - ' +
    (user.room || '/')
  );
};
