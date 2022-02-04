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

![POS Options](/pasigono/pasigono/public/images/1.PNG)

The POS Profile can be found at:

> Retail > Settings and Configurations > Point-of-Sale Profile

#### License

MIT
