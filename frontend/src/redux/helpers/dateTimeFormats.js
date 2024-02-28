import { format, parseISO, formatISO } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export const formatDateTimeForDisplay = (dateTimeString, userTimezone) => {
  const formattedDateTime = dateTimeString
    ? format(
        utcToZonedTime(parseISO(dateTimeString), userTimezone),
        "yyyy-MM-dd'T'HH:mm"
      )
    : "";
  return formattedDateTime;
};

export const formatToISO = (dateString) => {
  const date = dateString ? new Date(dateString) : new Date();
  return formatISO(date);
};

export const ISO_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX";
export const CUSTOM_DATE_FORMAT = "dd/MM/yyyy";
