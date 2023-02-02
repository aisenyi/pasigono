from . import __version__ as app_version

app_name = "pasigono"
app_title = "Pasigono"
app_publisher = "Pasigono"
app_description = "ERPNExt customizations for Pasigono"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "malisa.aisenyi@gmail.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/pasigono/css/pasigono.css"
app_include_js = ["form-raw.bundle.js", "https://js.stripe.com/terminal/v1/",
					"/assets/pasigono/js/jsrsasign-all-min.js", "pos-mettler-toledo.bundle.js"]

# include js, css files in header of web template
# web_include_css = "/assets/pasigono/css/pasigono.css"
# web_include_js = "/assets/pasigono/js/pasigono.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "pasigono/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
page_js = {"point-of-sale" : "custom_scripts/point_of_sale/point_of_sale.js"}

# include js in doctype views
doctype_js = {"POS Profile" : "custom_scripts/pos_profile/pos_profile.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "pasigono.install.before_install"
# after_install = "pasigono.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "pasigono.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
	"AccountsController": {
		"validate": "pasigono.custom_scripts.amount_in_words.validate"
	},
}


# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"pasigono.tasks.all"
# 	],
# 	"daily": [
# 		"pasigono.tasks.daily"
# 	],
# 	"hourly": [
# 		"pasigono.tasks.hourly"
# 	],
# 	"weekly": [
# 		"pasigono.tasks.weekly"
# 	]
# 	"monthly": [
# 		"pasigono.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "pasigono.install.before_tests"

# Overriding Methods
# ------------------------------
#
override_whitelisted_methods = {
	#"frappe.desk.doctype.event.event.get_events": "stripe_terminal.event.get_events"
	"erpnext.accounts.doctype.pos_invoice.pos_invoice.make_sales_return": "pasigono.custom_scripts.controllers.sales_and_purchase_return.make_sales_return"
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "pasigono.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

user_data_fields = [
	{
		"doctype": "{doctype_1}",
		"filter_by": "{filter_by}",
		"redact_fields": ["{field_1}", "{field_2}"],
		"partial": 1,
	},
	{
		"doctype": "{doctype_2}",
		"filter_by": "{filter_by}",
		"partial": 1,
	},
	{
		"doctype": "{doctype_3}",
		"strict": False,
	},
	{
		"doctype": "{doctype_4}"
	}
]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"pasigono.auth.validate"
# ]

#For jinja printing
jinja = {
	"methods": [
		"pasigono.custom_scripts.amount_in_words.money_in_words"
	]
}

