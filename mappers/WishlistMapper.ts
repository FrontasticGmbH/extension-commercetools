import { Wishlist } from '../../../types/wishlist/Wishlist';
import { ShoppingList, ShoppingListLineItem } from '@commercetools/platform-sdk';
import { ShoppingListDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/shopping-list';
import { Locale } from '../Locale';
import { LineItem } from '../../../types/wishlist/LineItem';
import { ProductRouter } from '../utils/ProductRouter';
import { ProductMapper } from './ProductMapper';
import getLocalizedValue from "../utils/GetLocalizedValue";

export class WishlistMapper {
  static commercetoolsShoppingListToWishlist = (commercetoolsShoppingList: ShoppingList, locale: Locale, defaultLocale:string): Wishlist => {
    return {
      wishlistId: commercetoolsShoppingList.id,
      wishlistVersion: commercetoolsShoppingList.version.toString(),
      anonymousId: commercetoolsShoppingList.anonymousId,
      accountId: commercetoolsShoppingList.customer?.id ?? undefined,
      name: getLocalizedValue(commercetoolsShoppingList.name, locale, defaultLocale),
      lineItems: (commercetoolsShoppingList.lineItems || []).map((lineItem) =>
        WishlistMapper.commercetoolsLineItemToLineItem(lineItem, locale, defaultLocale),
      ),
    };
  };

  private static commercetoolsLineItemToLineItem = (
    commercetoolsLineItem: ShoppingListLineItem,
    locale: Locale,
    defaultLocale:string
  ): LineItem => {
    const lineItem: LineItem = {
      lineItemId: commercetoolsLineItem.id,
      productId: commercetoolsLineItem.productId,
      name:getLocalizedValue(commercetoolsLineItem.name, locale, defaultLocale),
      type: 'variant',
      addedAt: new Date(commercetoolsLineItem.addedAt),
      count: commercetoolsLineItem.quantity,
      variant: ProductMapper.commercetoolsProductVariantToVariant(commercetoolsLineItem.variant, locale),
    };
    lineItem._url = ProductRouter.generateUrlFor(lineItem);
    return lineItem;
  };

  static wishlistToCommercetoolsShoppingListDraft = (
    wishlist: Omit<Wishlist, 'wishlistId'>,
    locale: Locale,
  ): ShoppingListDraft => {
    return {
      anonymousId: wishlist.anonymousId,
      customer: wishlist.accountId === undefined ? undefined : { typeId: 'customer', id: wishlist.accountId },
      name: { [locale.language]: wishlist.name || '' },
    };
  };
}
