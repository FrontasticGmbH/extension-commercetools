import { Wishlist } from '../../../types/wishlist/Wishlist';
import { ShoppingList, ShoppingListLineItem } from '@commercetools/platform-sdk';
import { ShoppingListDraft } from '@commercetools/platform-sdk/dist/declarations/src/generated/models/shopping-list';
import { Locale } from '../Locale';
import { LineItem } from '../../../types/wishlist/LineItem';
import { ProductRouter } from '../../utils/ProductRouter';

export class WishlistMapper {
  static commercetoolsShoppingListToWishlist = (commercetoolsShoppingList: ShoppingList, locale: Locale): Wishlist => {
    return {
      wishlistId: commercetoolsShoppingList.id,
      wishlistVersion: commercetoolsShoppingList.version.toString(),
      anonymousId: commercetoolsShoppingList.anonymousId,
      accountId: commercetoolsShoppingList.customer?.id ?? undefined,
      name: commercetoolsShoppingList.name[locale.language],
      lineItems: (commercetoolsShoppingList.lineItems || []).map((lineItem) =>
        WishlistMapper.commercetoolsLineItemToLineItem(lineItem, locale),
      ),
    };
  };

  private static commercetoolsLineItemToLineItem = (
    commercetoolsLineItem: ShoppingListLineItem,
    locale: Locale,
  ): LineItem => {
    const lineItem: LineItem = {
      lineItemId: commercetoolsLineItem.id,
      name: commercetoolsLineItem.name[locale.language],
      type: 'variant',
      addedAt: new Date(commercetoolsLineItem.addedAt),
      count: commercetoolsLineItem.quantity,
      variant: {
        sku: commercetoolsLineItem.variant.sku,
        images: commercetoolsLineItem.variant?.images?.map((image) => image.url),
      },
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
