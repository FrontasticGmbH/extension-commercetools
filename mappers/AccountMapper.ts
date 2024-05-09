import {
  Address as CommercetoolsAddress,
  BaseAddress,
  Customer as commercetoolsCustomer,
} from '@commercetools/platform-sdk';
import { Account } from '@Types/account/Account';
import { Address } from '@Types/account/Address';
import { Locale } from '../Locale';
import { Guid } from '@Commerce-commercetools/utils/Guid';

export class AccountMapper {
  static commercetoolsCustomerToAccount(commercetoolsCustomer: commercetoolsCustomer): Account {
    return {
      accountId: commercetoolsCustomer.id,
      email: commercetoolsCustomer.email,
      salutation: commercetoolsCustomer?.salutation,
      firstName: commercetoolsCustomer?.firstName,
      lastName: commercetoolsCustomer?.lastName,
      birthday: commercetoolsCustomer?.dateOfBirth ? new Date(commercetoolsCustomer.dateOfBirth) : undefined,
      confirmed: commercetoolsCustomer.isEmailVerified,
      version: commercetoolsCustomer.version,
      addresses: this.commercetoolsAddressesToAddresses(
        commercetoolsCustomer.addresses,
        commercetoolsCustomer.defaultBillingAddressId,
        commercetoolsCustomer.defaultShippingAddressId,
        commercetoolsCustomer.billingAddressIds,
        commercetoolsCustomer.shippingAddressIds,
      ),
    } as Account;
  }

  static commercetoolsAddressesToAddresses(
    commercetoolsAddresses: CommercetoolsAddress[],
    defaultBillingAddressId?: string,
    defaultShippingAddressId?: string,
    billingAddressIds?: string[],
    shippingAddressIds?: string[],
  ): Address[] {
    const addresses: Address[] = [];

    commercetoolsAddresses.forEach((commercetoolsAddress) => {
      addresses.push({
        ...this.commercetoolsAddressToAddress(commercetoolsAddress),
        isDefaultBillingAddress: commercetoolsAddress.id === defaultBillingAddressId,
        isDefaultShippingAddress: commercetoolsAddress.id === defaultShippingAddressId,
        isBillingAddress: billingAddressIds.includes(commercetoolsAddress.id),
        isShippingAddress: shippingAddressIds.includes(commercetoolsAddress.id),
      } as Address);
    });

    return addresses;
  }

  static commercetoolsAddressToAddress(commercetoolsAddress: CommercetoolsAddress): Address {
    return {
      addressId: commercetoolsAddress.id,
      key: commercetoolsAddress?.key ?? undefined,
      salutation: commercetoolsAddress.salutation ?? undefined,
      firstName: commercetoolsAddress.firstName ?? undefined,
      lastName: commercetoolsAddress.lastName ?? undefined,
      streetName: commercetoolsAddress.streetName ?? undefined,
      streetNumber: commercetoolsAddress.streetNumber ?? undefined,
      additionalStreetInfo: commercetoolsAddress.additionalStreetInfo ?? undefined,
      additionalAddressInfo: commercetoolsAddress.additionalAddressInfo ?? undefined,
      postalCode: commercetoolsAddress.postalCode ?? undefined,
      city: commercetoolsAddress.city ?? undefined,
      country: commercetoolsAddress.country ?? undefined,
      state: commercetoolsAddress.state ?? undefined,
      phone: commercetoolsAddress.phone ?? undefined,
    };
  }

  static commercetoolsCustomerToAddresses: (commercetoolsCustomer: commercetoolsCustomer, locale: Locale) => Address[] =
    (commercetoolsCustomer: commercetoolsCustomer, locale: Locale) => {
      const addresses: Address[] = [];

      commercetoolsCustomer.addresses.forEach((commercetoolsAddress) => {
        addresses.push({
          isDefaultBillingAddress: commercetoolsAddress.id === commercetoolsCustomer.defaultBillingAddressId,
          isBillingAddress: commercetoolsCustomer.billingAddressIds.includes(commercetoolsAddress.id),
          isDefaultShippingAddress: commercetoolsAddress.id === commercetoolsCustomer.defaultShippingAddressId,
          isShippingAddress: commercetoolsCustomer.shippingAddressIds.includes(commercetoolsAddress.id),
        } as Address);
      });

      return addresses;
    };

  static addressToCommercetoolsAddress: (address: Address) => BaseAddress = (address: Address) => {
    return {
      id: address.addressId,
      key: Guid.newGuid(),
      salutation: address.salutation,
      firstName: address.firstName,
      lastName: address.lastName,
      streetName: address.streetName,
      streetNumber: address.streetNumber,
      additionalStreetInfo: address.additionalStreetInfo,
      additionalAddressInfo: address.additionalAddressInfo,
      postalCode: address.postalCode,
      city: address.city,
      country: address.country,
      state: address.state,
      phone: address.phone,
    } as BaseAddress;
  };
}
