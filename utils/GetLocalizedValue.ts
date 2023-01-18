import {Locale} from "../Locale";
import {LocalizedString} from "@commercetools/platform-sdk/dist/declarations/src/generated/models/common";

const getLocalizedValue = (productValue: LocalizedString, locale: Locale, defaultLocale: string): string => {

  if (!productValue) {
    return ""
  }
  if (productValue[locale.language]) {
    return productValue[locale.language];
  }
  if (productValue[locale.language]) {
    return productValue[locale.language];
  }
  if (productValue[defaultLocale]) {
    return productValue[defaultLocale];
  }

  return productValue[0];

}

export default getLocalizedValue
