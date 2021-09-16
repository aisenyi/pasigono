import frappe, erpnext
from erpnext.controllers.sales_and_purchase_return import validate_return
from erpnext.controllers.accounts_controller import validate_regional
from erpnext.controllers.accounts_controller import validate_einvoice_fields
from erpnext.accounts.doctype.pricing_rule.utils import (apply_pricing_rule_on_transaction,
	apply_pricing_rule_for_free_items, get_applied_pricing_rules)
from frappe.utils.data import flt, get_number_format_info, in_words, cint

@frappe.whitelist()
def money_in_words(number, main_currency = None, fraction_currency=None):
	"""
	Returns string in words with currency and fraction currency.
	"""
	from frappe.utils import get_defaults
	_ = frappe._

	try:
		# note: `flt` returns 0 for invalid input and we don't want that
		number = float(number)
	except ValueError:
		return ""

	number = flt(number)
	if number < 0:
		return ""

	d = get_defaults()
	if not main_currency:
		main_currency = d.get('currency', 'INR')
	if not fraction_currency:
		fraction_currency = frappe.db.get_value("Currency", main_currency, "fraction", cache=True) or _("Cent")

	number_format = frappe.db.get_value("Currency", main_currency, "number_format", cache=True) or \
		frappe.db.get_default("number_format") or "#,###.##"

	fraction_length = get_number_format_info(number_format)[2]

	n = "%.{0}f".format(fraction_length) % number

	numbers = n.split('.')
	main, fraction =  numbers if len(numbers) > 1 else [n, '00']

	if len(fraction) < fraction_length:
		zeros = '0' * (fraction_length - len(fraction))
		fraction += zeros

	in_million = True
	if number_format == "#,##,###.##": in_million = False

	# 0.00
	if main == '0' and fraction in ['00', '000']:
		out = "{0} {1}".format(main_currency, _('Zero'))
	# 0.XX
	elif main == '0':
		out = 'Zero' + ' ' +_('and') + ' ' + fraction + '/100'
	else:
		out = _(in_words(main, in_million).title())
		if cint(fraction):
			#out = out + ' ' + _('and') + ' ' + _(in_words(fraction, in_million).title()) + ' ' + fraction_currency
			out = out + ' ' + _('and') + ' ' + fraction + '/100'

	return out.capitalize() + ' ' + _('only.')
	
#
# convert number to words
#
def in_words(integer, in_million=True):
	"""
	Returns string in words for the given integer.
	"""
	from num2words import num2words

	locale = 'en_IN' if not in_million else frappe.local.lang
	integer = int(integer)
	try:
		ret = num2words(integer, lang=locale)
	except NotImplementedError:
		ret = num2words(integer, lang='en')
	except OverflowError:
		ret = num2words(integer, lang='en')
	return ret
