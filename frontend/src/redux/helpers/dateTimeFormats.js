import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDateTimeForDisplay = (dateTimeString, userTimezone) => {
  const formattedDateTime = dateTimeString
    ? dayjs.utc(dateTimeString).tz(userTimezone).format("YYYY-MM-DDTHH:mm")
    : "";
  return formattedDateTime;
};

export const formatToISO = (dateString) => {
  const date = dateString ? dayjs(dateString) : dayjs();
  return date.format();
};

export const ISO_DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm:ssZ";
export const CUSTOM_DATE_FORMAT = "DD/MM/YYYY";
