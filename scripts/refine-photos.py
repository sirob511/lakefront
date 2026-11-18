"""Compatibility entry point for the exact-file, reviewed photograph manifest."""
import pathlib
import runpy

runpy.run_path(str(pathlib.Path(__file__).with_name('fetch-photos.py')), run_name='__main__')
