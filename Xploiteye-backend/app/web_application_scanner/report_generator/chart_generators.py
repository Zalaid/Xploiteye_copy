"""
Chart Generation Utilities for XploitEye Professional Reports
"""

from reportlab.graphics.shapes import Drawing, String, Circle, Line, Polygon
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib import colors
from reportlab.graphics.charts.legends import Legend
import math

def create_severity_pie_chart(severity_counts):
    drawing = Drawing(400, 250)
    labels = []
    data = []
    colors_map = {
        'critical': colors.HexColor('#D32F2F'),
        'high': colors.HexColor('#F57C00'),
        'medium': colors.HexColor('#FBC02D'),
        'low': colors.HexColor('#388E3C'),
        'unknown': colors.HexColor('#757575')
    }

    pie_colors = []
    for severity in ['critical', 'high', 'medium', 'low']:
        count = severity_counts.get(severity, 0)
        if count > 0:
            labels.append(f'{severity.title()}: {count}')
            data.append(count)
            pie_colors.append(colors_map[severity])

    if not data:
        labels = ['No Significant Findings']
        data = [1]
        pie_colors = [colors.HexColor('#388E3C')]

    pie = Pie()
    pie.x = 100
    pie.y = 50
    pie.width = 150
    pie.height = 150
    pie.data = data
    pie.labels = [str(d) for d in data]
    pie.slices.strokeWidth = 1
    pie.slices.strokeColor = colors.white

    for i, color in enumerate(pie_colors):
        pie.slices[i].fillColor = color
        pie.slices[i].labelRadius = 1.2

    legend = Legend()
    legend.x = 280
    legend.y = 100
    legend.dx = 10
    legend.dy = 10
    legend.fontName = 'Helvetica'
    legend.fontSize = 10
    legend.colorNamePairs = list(zip(pie_colors, labels))

    title = String(200, 220, 'Vulnerability Severity Distribution', textAnchor='middle')
    title.fontName = 'Helvetica-Bold'
    title.fontSize = 14

    drawing.add(pie)
    drawing.add(legend)
    drawing.add(title)
    return drawing

def create_risk_gauge(risk_score, risk_level):
    drawing = Drawing(400, 250)
    center_x, center_y = 200, 100
    radius = 80

    for angle in range(180, 0, -2):
        x1 = center_x + radius * math.cos(math.radians(angle))
        y1 = center_y + radius * math.sin(math.radians(angle))
        x2 = center_x + (radius - 15) * math.cos(math.radians(angle))
        y2 = center_y + (radius - 15) * math.sin(math.radians(angle))

        if angle > 144: color = colors.HexColor('#388E3C')
        elif angle > 108: color = colors.HexColor('#8BC34A')
        elif angle > 72: color = colors.HexColor('#FBC02D')
        elif angle > 36: color = colors.HexColor('#F57C00')
        else: color = colors.HexColor('#D32F2F')

        line = Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=10)
        drawing.add(line)

    needle_angle = 180 - (float(risk_score) * 18)
    needle_len = radius - 10
    nx = center_x + needle_len * math.cos(math.radians(needle_angle))
    ny = center_y + needle_len * math.sin(math.radians(needle_angle))
    
    drawing.add(Line(center_x, center_y, nx, ny, strokeColor=colors.black, strokeWidth=3))
    drawing.add(Circle(center_x, center_y, 5, fillColor=colors.black))

    drawing.add(String(center_x, center_y - 30, f'Score: {risk_score}/10', textAnchor='middle', fontName='Helvetica-Bold', fontSize=16))
    drawing.add(String(center_x, center_y - 50, risk_level.upper(), textAnchor='middle', fontName='Helvetica-Bold', fontSize=12))
    drawing.add(String(center_x, 220, 'Overall Risk Assessment', textAnchor='middle', fontName='Helvetica-Bold', fontSize=14))
    
    return drawing

def create_tech_distribution_chart(tech_stack):
    drawing = Drawing(450, 300)
    if not tech_stack:
        return drawing
        
    labels = list(tech_stack.keys())
    data = [1] * len(labels)

    chart = VerticalBarChart()
    chart.x = 50
    chart.y = 50
    chart.height = 150
    chart.width = 350
    chart.data = [data]
    chart.categoryAxis.categoryNames = labels
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 2
    chart.valueAxis.visible = False
    
    for i in range(len(labels)):
        chart.bars[(0, i)].fillColor = colors.HexColor('#1976D2')

    drawing.add(chart)
    drawing.add(String(225, 270, 'Detected Technology Inventory', textAnchor='middle', fontName='Helvetica-Bold', fontSize=14))
    return drawing
