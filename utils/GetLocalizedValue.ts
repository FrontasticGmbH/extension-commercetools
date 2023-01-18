import {Locale} from "../Locale";
import {LocalizedString} from "@commercetools/platform-sdk/dist/declarations/src/generated/models/common";

const getLocalizedValue = (productValue: LocalizedString, locale: Locale, defaultLocale: string): string => {

  let finalLocalizedString;

  //We should check if value is not empty to avoid errors
  if (productValue) {
    if (productValue[locale.language]) {
      finalLocalizedString = productValue[locale.language];
    } else if (productValue[defaultLocale]) {
      finalLocalizedString = productValue[defaultLocale];
    } else {
      finalLocalizedString = productValue[0];
    }
  } else {
    finalLocalizedString = productValue;
  }


  return finalLocalizedString as string

}

export default getLocalizedValue
