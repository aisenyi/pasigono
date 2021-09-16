# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt
from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils import get_url, call_hook_method, cint, flt
import json
import stripe

@frappe.whitelist(allow_guest=True)
def get_stripe_terminal_settings():
	try:
		return frappe.get_single("Stripe Terminal Settings")
	except Exception as e:
		frappe.log_error(frappe.get_traceback(), "stripe_terminal.stripe_terminal.api.get_stripe_terminal_settings.")


@frappe.whitelist(allow_guest=True)
def get_stripe_terminal_token():
	stripe_settings = frappe.db.get_all("Stripe Settings")
	if stripe_settings:
		gateway_settings = frappe.get_doc("Stripe Settings",stripe_settings[0].name)
		stripe.api_key = gateway_settings.get_password('secret_key')
		connection_token = stripe.terminal.ConnectionToken.create()
		return connection_token

@frappe.whitelist(allow_guest=True)
def payment_intent_creation(sales_invoice):
	sales_invoice = json.loads(sales_invoice)
	stripe_settings = frappe.db.get_all("Stripe Settings")
	if stripe_settings:
		currency = sales_invoice.get("currency")
		grand_total = sales_invoice.get("grand_total")
		gateway_settings = frappe.get_doc("Stripe Settings",stripe_settings[0].name)
		stripe.api_key = gateway_settings.get_password('secret_key')
		#The amount is multiplied by 100 because the api acceps payments in cents. Had to do around to two decimal places then convert to integer
		payment_intent = stripe.PaymentIntent.create(
		  amount = int(round(grand_total, 2)*100),
		  currency= currency.lower(),
		  payment_method_types = ['card_present'],
		  capture_method = 'manual',
		)
		
		return payment_intent
		
@frappe.whitelist(allow_guest=True)
def cancel_payment_intent(payment_intent_id,sales_invoice_id=None):
	stripe_settings = frappe.db.get_all("Stripe Settings")
	if stripe_settings:
		gateway_settings = frappe.get_doc("Stripe Settings",stripe_settings[0].name)
		stripe.api_key = gateway_settings.get_password('secret_key')
		intent = stripe.PaymentIntent.cancel(
		  payment_intent_id
		)
		return intent
		
@frappe.whitelist(allow_guest=True)
def capture_payment_intent(payment_intent_id,sales_invoice_id=None):
	stripe_settings = frappe.db.get_all("Stripe Settings")
	if stripe_settings:
		gateway_settings = frappe.get_doc("Stripe Settings",stripe_settings[0].name)
		stripe.api_key = gateway_settings.get_password('secret_key')
		intent = stripe.PaymentIntent.capture(
		  payment_intent_id
		)
		return intent

@frappe.whitelist(allow_guest=True)
def update_payment_intent(payment_intent_id,sales_invoice_id):
	if sales_invoice_id:
		stripe_settings = frappe.db.get_all("Stripe Settings")
		sales_invoice = frappe.get_doc("POS Invoice",sales_invoice_id)
		if stripe_settings:
			gateway_settings = frappe.get_doc("Stripe Settings",stripe_settings[0].name)
			stripe.api_key = gateway_settings.get_password('secret_key')
			intent = stripe.PaymentIntent.modify(
			  payment_intent_id,
			  metadata = {"POS Invoice":sales_invoice_id,"Customer":sales_invoice.customer}
			)
			return intent
			
@frappe.whitelist(allow_guest=True)
def refund_payment(payment_intent_id, amount):
	refund = stripe.Refund.create(
		payment_intent=payment_intent_id,
		amount=amount
	)
	return refund
