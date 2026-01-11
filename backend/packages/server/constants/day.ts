const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const getDay = (date: string): string => {
  return DAYS[new Date(date).getDay()];
};

export const getTimeStamp = (localTime: String) => {
  return (
    " [ User's Time: " +
    localTime.split(" ")[1] +
    " Date: " +
    localTime.split(" ")[0] +
    " Day: " +
    getDay(localTime.split(" ")[0]) +
    " ]"
  );
};
