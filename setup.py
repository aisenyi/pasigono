from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in pasigono/__init__.py
from pasigono import __version__ as version

setup(
	name='pasigono',
	version=version,
	description='ERPNExt customizations for Pasigono',
	author='Pasigono',
	author_email='malisa.aisenyi@gmail.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
