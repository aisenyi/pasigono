## ERPNext POS Hardware Integrations

This custom app adds the following functionality to ERPNext's Point of Sale:

- Weigh scale integration to get weights for items
- Stripe Terminal integration to accept card payments within the POS
- Raw printing via QZ Tray to bypass the print preview screen and print directly to printers with ESC/POS commands, as well as controlling the opening of cash drawers connected to printers

Some features will not work universally on all hardware. Specifics for each of these areas are listed in the following sections. In addition to the above features which will be fleshed out in the sections below, this customization also bypasses the submit dialog to confirm posting the POS invoice.

This [YouTube video](https://www.youtube.com/watch?v=RRqSBRsqLQs) is a brief run-through of the app's hardware integrations.

This app has been tested and is working with the following versions:

- ERPNext v13.17.0 and Frappe v13.17.1
- ERPNext v13.18.0 and Frappe v13.18.0
- ERPNext v13.19.0 and Frappe 13.19.0

A huge thanks to Aisenyi Malisa for all of his hard work creating this!

### Installation and Settings

From the directory of your bench, run the following commands:

> bench get-app https://github.com/aisenyi/pasigono.git
>
> bench --site site.name install-app pasigono

These options will be added to the bottom of the POS Profile:

![POS Options](/pasigono/public/images/1.PNG)

The POS Profile can be found at:

> Retail > Settings and Configurations > Point-of-Sale Profile

### Weigh Scales

A digital weight scale must have a physical connection to the POS terminal (usually USB or DB9). Digital weigh scales used in commerce generally communicate serially via RS232. This integration was done for and tested with the Mettler Toledo Ariva-S scales. It should work out of the box with any Mettler Toledo scales that use the Mettler Toledo 8217 protocol. All this means is these are the serial settings:

- Baud rate: 9600
- Parity: 1
- Stopbits: 1
- Databits: 7

For now, these values are hard-coded in the app (found [here](https://github.com/aisenyi/pasigono/blob/master/pasigono/custom_scripts/pos_scripts/pos_mettler_toledo.js) at line 48). Most digital scales will allow you to adjust serial values. Serial settings could either be adjusted to the values above, or the app could be forked and the script adjusted to the default values of your scale.
As a note, though, digital scales may not be communicating via RS232 by default. Check the manual to see how to change communication methods and change serial settings. This *should* work with any scale capable of RS232 communication, but it has only been tested with the Mettler Toledo Ariva-S.

### Getting Started with a POS Session

A compatible scale must be connected to the machine that will be used for the Point of Sale.

Select the checkbox next to "Enable Weigh Scale" in the POS Profile and save the POS Profile:

![POS Profile](/pasigono/public/images/1.PNG)

When opening the Point of Sale and after selecting the POS Profile, a box will pop up to allow communication with the scale:

![Permission to Connect](/pasigono/public/images/4.png)



If permission is granted, the browser will have a dialog that lists all devices available:

![Select Scale](/pasigono/public/images/3.png)

Click on the scale from the list and click on "Connect." The scale is now ready to be used in transactions!

#### Using the Scale in the Point of Sale

To use the scale in the Point of Sale:

1. Add the item to be weighed to the cart.
2. Click on the item in the cart, which will show the "Item Details."
3. Place the product on the scale. The quantity will update with the weight outputted from the scale.

![Using the Scale](https://drive.google.com/uc?id=1QdQY5Ko8mReR9UKj8BuOfbXYQzTKLpk7)

#### Limitations and Compatibility

The weigh scale currently only works with one browser, Google Chrome. It has been tested with Windows. It may need more done to work with Mac or Linux.

### Stripe Terminal

Stripe Terminal is a Point of Sale credit card terminal. Many others in the space only offer iOS and Android SDKs with no options for JavaScript. In addition to a JavaScript SDK, Stripe seemed liked the easiest path and hopefully has the potential to keep expanding into new regions. Until recently, it was only available in Canada and the United States. Now it has rolled out to a handful of additional countries:

- Australia
- Canada
- France
- Germany
- Ireland
- Netherlands
- New Zealand
- Singapore
- United Kingdom

More about Stripe Terminal can be found [here](https://stripe.com/terminal). Stripe only offers one reader that works with JavaScript and thus this integration, the [BBPOS WisePOS E](https://stripe.com/docs/terminal/payments/setup-reader/bbpos-wisepos-e) (pricing in the United States is $249 USD plus tax per unit). This reader can only communicate via ethernet or WiFi. Ethernet requires the purchase of a charging dock for the device. United States pricing for the dock is $49 USD.

#### Getting Started

If you're not currently using Stripe's payment gateway, you'll have to sign up for an account. After that, you can order a card reader from your Stripe dashboard and activate the reader from there when it arrives. More information can be found [here](https://stripe.com/docs/terminal/fleet/placing-orders).

If you are currently using Stripe within ERPNext, Stripe Terminal will use your same public/private keys that are entered in Stripe Settings. If not, you can add them. Documentation for setting up Stripe can be found [here](https://docs.erpnext.com/docs/v13/user/manual/en/erpnext_integration/stripe-integration).

Lastly, a Mode of Payment needs to be tied to Stripe.

> Accounting > Settings > Mode of Payment

You can either create a new mode of payment or change the account in a current mode of payment to use Stripe's payment gateway account. Make sure to add the mode of payment and make it active in the POS Profile.

![Mode of Payment](/pasigono/public/images/5.png)

#### Using Stripe Terminal in the Point of Sale

In the Point of Sale Profile, enable Stripe Terminal, select the corresponding mode of payment, and save the POS Profile:

> Retail > Setting and Configurations > Point-of-Sale Profile

![POS Profile](/pasigono/public/images/1.PNG)

When you open a new POS session, you will be prompted to choose a credit card reader from those available on the network. Readers are named based on the names chosen during activation in Stripe's dashboard. Choose a reader and click "Submit." That reader will now be active for the rest of the session or until a page reload.

![Choose Reader](/pasigono/public/images/6.png)

During the checkout process, if the mode of payment tied to Stripe is selected, when "Complete Order" is clicked or tapped, the POS will send the payment information to the Stripe reader, and a box will appear and remain on the cashier's screen until payment is processed.

![Payment Processing](/pasigono/public/images/7.png)

#### Stripe Terminal Display

Meanwhile, before checkout begins, the customer will see a cart display on the card reader.

![Cart Display](/pasigono/public/images/PXL_20220203_021232193.jpg)

I'm not sure why, but when an item is added to the cart, there is a screen flicker that is a bit of a distraction. One limitation of the Stripe Terminal is that quantity can only be displayed as whole numbers.

Once the mode of payment associated with Stripe is selected and "Checkout" is clicked, the customer will see this screen prompting them for payment:

![Payment Screen](/pasigono/public/images/PXL_20220203_021253491.jpg)

#### Changing Mode of Payment after Stripe Is Selected

If a customer changes their mind and pays with cash instead of card but the cashier has already selected the mode of payment associated with Stripe, it can be changed by clicking the "x" in the "Collecting Payments" dialog:

![Close Collecting Payments](/pasigono/public/images/7.png)

This, however, will freeze the Point of Sale, and the page will need to be reloaded and the items added to the cart once again.

#### Returns

The workflow for returns for a payment made with the Stripe Terminal are the same as a return with any other mode of payment in ERPNext. The card reader may prompt to insert the original payment method.

#### Receipts and Compliance

Stripe Terminal does not share any cardholder data with ERPNext or the browser, which makes aspects of PCI compliance (at least in my geography) minimal. More information specific to Stripe Terminal can be found [here](https://support.stripe.com/questions/pci-compliance-validation-for-stripe-terminal).

More broad resources from Stripe touching on PCI DSS compliance and best practices for integrating Stripe are here:

- [A Guide to PCI Compliance](https://stripe.com/ae/guides/pci-compliance)
- [Integration Security Guide](https://stripe.com/docs/security/guide)
- [Security at Stripe](https://stripe.com/docs/security/stripe)

One area where regulatory compliance is necessary on the ERPNext end is to provide receipts with certain required fields, as Stripe outlines [here](https://stripe.com/docs/terminal/features/receipts). This app creates a print format named "Stripe POS Invoice" that includes these fields when the payment mode is the one associated with Stripe. It will print the same receipt without these fields when the mode of payment is something else. Note that this included print format is not the one used for raw printing; it is only used if not using raw printing. The format is somewhat basic, so a person may want to duplicate it to make changes.

> Settings > Printing > Print Format

#### Regional Considerations

Stripe Terminal generally relies on the Visa and Mastercard networks to process payments. In the United States, virtually all debit cards are co-branded with either Visa or MasterCard, which means they can be accepted with Stripe. You may want to visit your country's page [here](https://stripe.com/docs/terminal/payments/regional) describing anything that might be a drawback to using Stripe Terminal and laying out what types of payments are accepted in your location.

Of particular note here, Stripe Terminal's handling of debit cards in Canada is a bit different than the rest of the countries on the list because Interac is accepted with Stripe Terminal in Canada. **This app will not work with Interac transactions in Canada as of this writing.** If you have an interest in using Stripe Terminal in Canada, though, do reach out. It won't take much get Interac working.

#### Compatibility

As this communicates on the local network, it can be used on any device (unlike other pieces of this custom app). Whereas the weigh scale and printing/cash drawer control will only work with Windows, Max, or Linux, the credit card reader will work with Android and iOS (as well as any browser).

### Printers and Cash drawers

ERPNext allows [raw printing](https://docs.erpnext.com/docs/v13/user/manual/en/setting-up/print/raw-printing), which sends commands in the printer's native language and bypasses the print drivers. This integration makes use of raw printing to print directly to ESC/POS printers. It should work with any ESC/POS printer but has only been tested with the Epson TM-T20iii and Epson TM-T88vi.

Raw printing requires the installation of [QZ Tray](https://qz.io/) on the computer that will be used as the Point of Sale terminal. QZ Tray is only available for Windows, Mac, and Linux, which limits raw printing functionality to these operating systems. More information on raw printing with ERPNext and using QZ Tray can be found in ERPNext's [documentation](https://docs.erpnext.com/docs/v13/user/manual/en/setting-up/print/raw-printing), and information on installing QZ Tray can be found [here](https://qz.io/wiki/using-qz-tray).

This integration allows for direct printing (which bypasses the system print preview and just prints) and opening the cash drawer. Settings for raw printing are found at the bottom of the Point-of-Sale Profile. Currently, you can select whether to print a receipt automatically on every order and whether to open the cash drawer automatically on every order:

> Retail > Settings and Configurations > Point-of-Sale Profile

![pos_settings](/pasigono/public/images/1.PNG)

#### About ESC/POS Printers

Most retail POS printers accept commands in the ESC/POS language. These printers have an RJ11/RJ12 jack that accepts a connection to a cash drawer. With the cash drawer connected, either through the printer's driver or with the correct ESC/POS commands, the opening of the cash drawer is accomplished by the printer sending a 24V pulse to the cash drawer.

#### Using Raw Printing to Control a Printer and Cash Drawer

Once raw printing has been enabled in the POS Profile, when a POS session is opened or refreshed, the following dialog will appear:

![Printer List](/pasigono/public/images/12.png)

All available printers will be listed, so a driver needs to first be installed for the printer before it can be used. This includes both network printer and local ones, such as those connected by USB, so either can be used.

Select the correct printer:

![Choose a Printer](/pasigono/public/images/13.png)

The chosen printer will remain active for the session or until the page is reloaded.

Options to open the cash drawer appear in both the checkout screen and the invoice screen:

![Checkout Screen](/pasigono/public/images/14.png)

![Receipt Screen](/pasigono/public/images/15.png)

Clicking or tapping the button to open the cash drawer obviously does just that. The "Direct Print" button in the image above prints the POS Invoice (without further dialog).

#### QZ Tray Keys and Certificate

QZ Tray is open source software, but using it without setting up the certificate and keys will result in this dialog popping up twice to perform every action like printing or opening the cash drawer:

![Security Warning](/pasigono/public/images/16.png)

There are two ways to disable these popups.

1 . Purchase a license from [QZ Tray](https://buy.qz.io/).

- Purchasing a license from QZ Tray will supply you with a trusted certificate and private certificate.

2 . Generate your own certificates for QZ Tray.

- If you prefer not to buy the license, you can generate your own certificates. More information can be found [here](https://qz.io/wiki/generate-certificate) and [here](https://buddhiv.medium.com/how-to-directly-print-from-your-browser-using-qz-tray-6c86ccd7b3f9).

##### Entering Certificate Information in ERPNext

After you've obtained certificates, search the Awesome Bar of ERPNext for "QZ Tray Settings." Enter your certificates here. On the next load of the POS, simply click the "Remember this decision" checkbox in the popup and then click on "Allow." Popups should be gone after that.

#### Changing Commands Sent to the Printer

The commands sent to the printer are located in this [file](https://github.com/aisenyi/pasigono/blob/master/pasigono/custom_scripts/pos_scripts/pos_controller.js) in the repo (beginning at line 380 for the receipt format and beginning at line 362 for opening the cash drawer). You may need to make changes to the receipt format to fit your needs, and it is possible that the commands sent to the printer for paper cutting or opening the cash drawer need tweaking for your particular model.

If that is the case, you would need to fork the repository in GitHub, make the necessary changes, and install the app from your forked repository. QZ Tray provides code examples for ESC/POS on [their website](https://qz.io/wiki/raw#escpos).

### Frequently Asked questions

##### Will this work with POS Awesome?

Unfortunately, this app is unlikely to work with POS Awesome.

##### Why do print drivers need to be installed if QZ Tray bypasses the print drivers?

Because of how QZ Tray works, it gives you a list of all installed and available system printers. Without a working print driver, you'll be unable to select the printer.

### License

MIT
