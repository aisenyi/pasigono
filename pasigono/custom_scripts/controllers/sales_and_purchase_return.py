from __future__ import unicode_literals
import frappe, erpnext
from frappe import _
from frappe.model.meta import get_field_precision
from erpnext.stock.utils import get_incoming_rate
from frappe.utils import flt, get_datetime, format_datetime

def get_returned_qty_map_for_row(row_name, doctype):
	child_doctype = doctype + " Item"
	reference_field = "dn_detail" if doctype == "Delivery Note" else frappe.scrub(child_doctype)

	fields = [
		"sum(abs(`tab{0}`.qty)) as qty".format(child_doctype),
		"sum(abs(`tab{0}`.stock_qty)) as stock_qty".format(child_doctype)
	]

	if doctype in ("Purchase Receipt", "Purchase Invoice"):
		fields += [
			"sum(abs(`tab{0}`.rejected_qty)) as rejected_qty".format(child_doctype),
			"sum(abs(`tab{0}`.received_qty)) as received_qty".format(child_doctype)
		]

		if doctype == "Purchase Receipt":
			fields += ["sum(abs(`tab{0}`.received_stock_qty)) as received_stock_qty".format(child_doctype)]

	data = frappe.db.get_list(doctype,
		fields = fields,
		filters = [
			[doctype, "docstatus", "=", 1],
			[doctype, "is_return", "=", 1],
			[child_doctype, reference_field, "=", row_name]
	])

	return data[0]

def make_return_doc(doctype, source_name, target_doc=None):
	from frappe.model.mapper import get_mapped_doc
	from erpnext.stock.doctype.serial_no.serial_no import get_serial_nos
	company = frappe.db.get_value("Delivery Note", source_name, "company")
	default_warehouse_for_sales_return = frappe.db.get_value("Company", company, "default_warehouse_for_sales_return")

	def set_missing_values(source, target):
		doc = frappe.get_doc(target)
		doc.is_return = 1
		doc.return_against = source.name
		doc.ignore_pricing_rule = 1
		doc.set_warehouse = ""
		if doctype == "Sales Invoice" or doctype == "POS Invoice":
			doc.is_pos = source.is_pos

			# look for Print Heading "Credit Note"
			if not doc.select_print_heading:
				doc.select_print_heading = frappe.db.get_value("Print Heading", _("Credit Note"))

		elif doctype == "Purchase Invoice":
			# look for Print Heading "Debit Note"
			doc.select_print_heading = frappe.db.get_value("Print Heading", _("Debit Note"))

		for tax in doc.get("taxes"):
			if tax.charge_type == "Actual":
				tax.tax_amount = -1 * tax.tax_amount

		if doc.get("is_return"):
			if doc.doctype == 'Sales Invoice' or doc.doctype == 'POS Invoice':
				doc.consolidated_invoice = ""
				doc.set('payments', [])
				for data in source.payments:
					paid_amount = 0.00
					base_paid_amount = 0.00
					data.base_amount = flt(data.amount*source.conversion_rate, source.precision("base_paid_amount"))
					paid_amount += data.amount
					base_paid_amount += data.base_amount
					doc.append('payments', {
						'mode_of_payment': data.mode_of_payment,
						'type': data.type,
						'amount': -1 * paid_amount,
						'base_amount': -1 * base_paid_amount,
						'account': data.account,
						'default': data.default,
						'card_brand': data.card_brand,
						'card_last4': data.card_last4,
						'card_account_type': data.card_account_type,
						'card_application_preferred_name': data.card_application_preferred_name,
						'card_dedicated_file_name': data.card_dedicated_file_name,
						'card_authorization_response_code': data.card_authorization_response_code,
						'card_application_cryptogram': data.card_application_cryptogram,
						'card_terminal_verification_results': data.card_terminal_verification_results,
						'card_transaction_status_information': data.card_transaction_status_information,
						'card_authorization_code': data.card_authorization_code,
						'card_charge_id': data.card_charge_id,
						'card_payment_intent': data.card_payment_intent
					})
				if doc.is_pos:
					doc.paid_amount = -1 * source.paid_amount
			elif doc.doctype == 'Purchase Invoice':
				doc.paid_amount = -1 * source.paid_amount
				doc.base_paid_amount = -1 * source.base_paid_amount
				doc.payment_terms_template = ''
				doc.payment_schedule = []

		if doc.get("is_return") and hasattr(doc, "packed_items"):
			for d in doc.get("packed_items"):
				d.qty = d.qty * -1

		doc.discount_amount = -1 * source.discount_amount
		doc.run_method("calculate_taxes_and_totals")

	def update_item(source_doc, target_doc, source_parent):
		target_doc.qty = -1 * source_doc.qty

		if source_doc.serial_no:
			returned_serial_nos = get_returned_serial_nos(source_doc, source_parent)
			serial_nos = list(set(get_serial_nos(source_doc.serial_no)) - set(returned_serial_nos))
			if serial_nos:
				target_doc.serial_no = '\n'.join(serial_nos)

		if doctype == "Purchase Receipt":
			returned_qty_map = get_returned_qty_map_for_row(source_doc.name, doctype)
			target_doc.received_qty = -1 * flt(source_doc.received_qty - (returned_qty_map.get('received_qty') or 0))
			target_doc.rejected_qty = -1 * flt(source_doc.rejected_qty - (returned_qty_map.get('rejected_qty') or 0))
			target_doc.qty = -1 * flt(source_doc.qty - (returned_qty_map.get('qty') or 0))

			target_doc.stock_qty = -1 * flt(source_doc.stock_qty - (returned_qty_map.get('stock_qty') or 0))
			target_doc.received_stock_qty = -1 * flt(source_doc.received_stock_qty - (returned_qty_map.get('received_stock_qty') or 0))

			target_doc.purchase_order = source_doc.purchase_order
			target_doc.purchase_order_item = source_doc.purchase_order_item
			target_doc.rejected_warehouse = source_doc.rejected_warehouse
			target_doc.purchase_receipt_item = source_doc.name

		elif doctype == "Purchase Invoice":
			returned_qty_map = get_returned_qty_map_for_row(source_doc.name, doctype)
			target_doc.received_qty = -1 * flt(source_doc.received_qty - (returned_qty_map.get('received_qty') or 0))
			target_doc.rejected_qty = -1 * flt(source_doc.rejected_qty - (returned_qty_map.get('rejected_qty') or 0))
			target_doc.qty = -1 * flt(source_doc.qty - (returned_qty_map.get('qty') or 0))

			target_doc.stock_qty = -1 * flt(source_doc.stock_qty - (returned_qty_map.get('stock_qty') or 0))
			target_doc.purchase_order = source_doc.purchase_order
			target_doc.purchase_receipt = source_doc.purchase_receipt
			target_doc.rejected_warehouse = source_doc.rejected_warehouse
			target_doc.po_detail = source_doc.po_detail
			target_doc.pr_detail = source_doc.pr_detail
			target_doc.purchase_invoice_item = source_doc.name
			target_doc.price_list_rate = 0

		elif doctype == "Delivery Note":
			returned_qty_map = get_returned_qty_map_for_row(source_doc.name, doctype)
			target_doc.qty = -1 * flt(source_doc.qty - (returned_qty_map.get('qty') or 0))
			target_doc.stock_qty = -1 * flt(source_doc.stock_qty - (returned_qty_map.get('stock_qty') or 0))

			target_doc.against_sales_order = source_doc.against_sales_order
			target_doc.against_sales_invoice = source_doc.against_sales_invoice
			target_doc.so_detail = source_doc.so_detail
			target_doc.si_detail = source_doc.si_detail
			target_doc.expense_account = source_doc.expense_account
			target_doc.dn_detail = source_doc.name
			if default_warehouse_for_sales_return:
				target_doc.warehouse = default_warehouse_for_sales_return
		elif doctype == "Sales Invoice" or doctype == "POS Invoice":
			returned_qty_map = get_returned_qty_map_for_row(source_doc.name, doctype)
			target_doc.qty = -1 * flt(source_doc.qty - (returned_qty_map.get('qty') or 0))
			target_doc.stock_qty = -1 * flt(source_doc.stock_qty - (returned_qty_map.get('stock_qty') or 0))

			target_doc.sales_order = source_doc.sales_order
			target_doc.delivery_note = source_doc.delivery_note
			target_doc.so_detail = source_doc.so_detail
			target_doc.dn_detail = source_doc.dn_detail
			target_doc.expense_account = source_doc.expense_account

			if doctype == "Sales Invoice":
				target_doc.sales_invoice_item = source_doc.name
			else:
				target_doc.pos_invoice_item = source_doc.name

			target_doc.price_list_rate = 0
			if default_warehouse_for_sales_return:
				target_doc.warehouse = default_warehouse_for_sales_return

	def update_terms(source_doc, target_doc, source_parent):
		target_doc.payment_amount = -source_doc.payment_amount

	doclist = get_mapped_doc(doctype, source_name,	{
		doctype: {
			"doctype": doctype,

			"validation": {
				"docstatus": ["=", 1],
			}
		},
		doctype +" Item": {
			"doctype": doctype + " Item",
			"field_map": {
				"serial_no": "serial_no",
				"batch_no": "batch_no"
			},
			"postprocess": update_item
		},
		"Payment Schedule": {
			"doctype": "Payment Schedule",
			"postprocess": update_terms
		}
	}, target_doc, set_missing_values)

	return doclist
	
@frappe.whitelist()
def make_sales_return(source_name, target_doc=None):
	return make_return_doc("POS Invoice", source_name, target_doc)
