# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2019-03-26 07:57
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('civictechprojects', '0023_auto_20190319_2004'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='project_date_modified',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
