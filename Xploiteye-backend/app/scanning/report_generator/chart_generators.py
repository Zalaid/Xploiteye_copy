"""
Chart Generation Utilities for Professional Security Reports
Generates visual charts for vulnerability assessment reports
"""

from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line, Polygon
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.graphics.charts.legends import Legend
from reportlab.platypus import Image
import math


def create_severity_pie_chart(severity_counts):
    """
    Create pie chart for vulnerability severity distribution

    Args:
        severity_counts: dict like {'critical': 1, 'high': 1, 'medium': 2, 'low': 1}

    Returns:
        Drawing object
    """
    drawing = Drawing(400, 250)

    # Prepare data
    labels = []
    data = []
    colors_map = {
        'critical': colors.HexColor('#D32F2F'),
        'high': colors.HexColor('#F57C00'),
        'medium': colors.HexColor('#FBC02D'),
        'low': colors.HexColor('#388E3C')
    }

    pie_colors = []
    for severity in ['critical', 'high', 'medium', 'low']:
        count = severity_counts.get(severity, 0)
        if count > 0:
            labels.append(f'{severity.title()}: {count}')
            data.append(count)
            pie_colors.append(colors_map[severity])

    if not data:
        # No vulnerabilities found
        labels = ['No Vulnerabilities']
        data = [1]
        pie_colors = [colors.HexColor('#388E3C')]

    # Create pie chart
    pie = Pie()
    pie.x = 100
    pie.y = 50
    pie.width = 150
    pie.height = 150
    pie.data = data
    pie.labels = [str(d) for d in data]
    pie.slices.strokeWidth = 1
    pie.slices.strokeColor = colors.white

    # Set colors
    for i, color in enumerate(pie_colors):
        pie.slices[i].fillColor = color
        pie.slices[i].labelRadius = 1.2
        pie.slices[i].fontColor = colors.black
        pie.slices[i].fontSize = 10
        pie.slices[i].fontName = 'Helvetica-Bold'

    # Add legend
    legend = Legend()
    legend.x = 280
    legend.y = 100
    legend.dx = 8
    legend.dy = 8
    legend.fontName = 'Helvetica'
    legend.fontSize = 10
    legend.columnMaximum = 4
    legend.alignment = 'right'
    legend.colorNamePairs = list(zip(pie_colors, labels))

    # Add title
    title = String(200, 220, 'Vulnerability Severity Distribution', textAnchor='middle')
    title.fontName = 'Helvetica-Bold'
    title.fontSize = 14

    drawing.add(pie)
    drawing.add(legend)
    drawing.add(title)

    return drawing


def create_risk_gauge(risk_score, risk_level):
    """
    Create speedometer-style gauge for risk score

    Args:
        risk_score: float (0-10)
        risk_level: str ('low', 'medium', 'high', 'critical')

    Returns:
        Drawing object
    """
    drawing = Drawing(400, 250)

    # Convert risk_score to float if string
    if isinstance(risk_score, str):
        risk_score = float(risk_score)

    # Draw gauge arc
    center_x = 200
    center_y = 100
    radius = 80

    # Draw background arc (gray)
    for angle in range(180, 0, -2):
        x1 = center_x + radius * math.cos(math.radians(angle))
        y1 = center_y + radius * math.sin(math.radians(angle))
        x2 = center_x + (radius - 15) * math.cos(math.radians(angle))
        y2 = center_y + (radius - 15) * math.sin(math.radians(angle))

        # Color zones
        if angle > 144:  # 0-2: Green
            color = colors.HexColor('#388E3C')
        elif angle > 108:  # 2-4: Yellow-Green
            color = colors.HexColor('#8BC34A')
        elif angle > 72:  # 4-7: Yellow/Orange
            color = colors.HexColor('#FBC02D')
        elif angle > 36:  # 7-9: Orange/Red
            color = colors.HexColor('#F57C00')
        else:  # 9-10: Red
            color = colors.HexColor('#D32F2F')

        line = Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=10)
        drawing.add(line)

    # Draw needle
    needle_angle = 180 - (risk_score * 18)  # Scale 0-10 to 180-0 degrees
    needle_length = radius - 10
    needle_x = center_x + needle_length * math.cos(math.radians(needle_angle))
    needle_y = center_y + needle_length * math.sin(math.radians(needle_angle))

    # Needle triangle
    needle = Polygon([center_x, center_y, needle_x, needle_y], strokeColor=colors.black, fillColor=colors.black, strokeWidth=3)
    drawing.add(needle)

    # Center circle
    center_circle = Circle(center_x, center_y, 8, fillColor=colors.black, strokeColor=colors.white, strokeWidth=2)
    drawing.add(center_circle)

    # Risk score text
    score_text = String(center_x, center_y - 30, f'{risk_score:.1f}/10', textAnchor='middle')
    score_text.fontName = 'Helvetica-Bold'
    score_text.fontSize = 18
    score_text.fillColor = colors.black
    drawing.add(score_text)

    # Risk level text
    level_colors = {
        'low': colors.HexColor('#388E3C'),
        'medium': colors.HexColor('#FBC02D'),
        'high': colors.HexColor('#F57C00'),
        'critical': colors.HexColor('#D32F2F')
    }
    level_text = String(center_x, center_y - 50, risk_level.upper(), textAnchor='middle')
    level_text.fontName = 'Helvetica-Bold'
    level_text.fontSize = 14
    level_text.fillColor = level_colors.get(risk_level.lower(), colors.black)
    drawing.add(level_text)

    # Scale labels
    labels = ['0', '2', '4', '6', '8', '10']
    label_angles = [180, 144, 108, 72, 36, 0]
    for label, angle in zip(labels, label_angles):
        label_x = center_x + (radius + 20) * math.cos(math.radians(angle))
        label_y = center_y + (radius + 20) * math.sin(math.radians(angle))
        label_str = String(label_x, label_y, label, textAnchor='middle')
        label_str.fontName = 'Helvetica'
        label_str.fontSize = 10
        drawing.add(label_str)

    # Title
    title = String(center_x, 220, 'Overall Risk Score', textAnchor='middle')
    title.fontName = 'Helvetica-Bold'
    title.fontSize = 14
    drawing.add(title)

    return drawing


def create_cvss_distribution_chart(vulnerabilities):
    """
    Create bar chart showing CVSS score distribution

    Args:
        vulnerabilities: list of dicts with 'cvss_score' field

    Returns:
        Drawing object
    """
    drawing = Drawing(450, 250)

    # Group CVSS scores into ranges
    ranges = {
        '0-2': 0,
        '2-4': 0,
        '4-7': 0,
        '7-9': 0,
        '9-10': 0
    }

    for vuln in vulnerabilities:
        try:
            score = float(vuln.get('cvss_score', 0))
            if score < 2:
                ranges['0-2'] += 1
            elif score < 4:
                ranges['2-4'] += 1
            elif score < 7:
                ranges['4-7'] += 1
            elif score < 9:
                ranges['7-9'] += 1
            else:
                ranges['9-10'] += 1
        except (ValueError, TypeError):
            continue

    # Create bar chart
    chart = VerticalBarChart()
    chart.x = 50
    chart.y = 50
    chart.height = 150
    chart.width = 350
    chart.data = [list(ranges.values())]
    chart.categoryAxis.categoryNames = list(ranges.keys())
    chart.categoryAxis.labels.boxAnchor = 'n'
    chart.categoryAxis.labels.angle = 0
    chart.categoryAxis.labels.fontName = 'Helvetica'
    chart.categoryAxis.labels.fontSize = 10

    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(ranges.values()) + 1 if max(ranges.values()) > 0 else 5
    chart.valueAxis.valueStep = 1
    chart.valueAxis.labels.fontName = 'Helvetica'
    chart.valueAxis.labels.fontSize = 10

    # Color bars based on severity
    bar_colors = [
        colors.HexColor('#388E3C'),  # 0-2 Low
        colors.HexColor('#8BC34A'),  # 2-4 Low-Med
        colors.HexColor('#FBC02D'),  # 4-7 Medium
        colors.HexColor('#F57C00'),  # 7-9 High
        colors.HexColor('#D32F2F')   # 9-10 Critical
    ]

    # Set bar colors using bars.strokeColor property
    chart.bars.strokeColor = colors.black
    chart.bars.strokeWidth = 1

    # Set individual bar colors
    for i in range(len(bar_colors)):
        chart.bars[(0, i)].fillColor = bar_colors[i]

    # Add title
    title = String(225, 220, 'CVSS Score Distribution', textAnchor='middle')
    title.fontName = 'Helvetica-Bold'
    title.fontSize = 14

    # Add axis labels
    x_label = String(225, 20, 'CVSS Score Range', textAnchor='middle')
    x_label.fontName = 'Helvetica'
    x_label.fontSize = 11

    y_label = String(15, 125, 'Count', textAnchor='middle')
    y_label.fontName = 'Helvetica'
    y_label.fontSize = 11

    drawing.add(chart)
    drawing.add(title)
    drawing.add(x_label)
    drawing.add(y_label)

    return drawing


def create_port_distribution_chart(services):
    """
    Create horizontal bar chart showing top services by port count

    Args:
        services: list of dicts with 'service' field

    Returns:
        Drawing object
    """
    drawing = Drawing(450, 300)

    # Count services
    service_counts = {}
    for svc in services:
        service_name = svc.get('service', 'unknown')
        service_counts[service_name] = service_counts.get(service_name, 0) + 1

    # Get top 10
    sorted_services = sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    if not sorted_services:
        sorted_services = [('No services', 0)]

    labels = [s[0] for s in sorted_services]
    data = [s[1] for s in sorted_services]

    # Create bar chart
    from reportlab.graphics.charts.barcharts import HorizontalBarChart
    chart = HorizontalBarChart()
    chart.x = 120
    chart.y = 50
    chart.height = 200
    chart.width = 300
    chart.data = [data]
    chart.categoryAxis.categoryNames = labels
    chart.categoryAxis.labels.boxAnchor = 'e'
    chart.categoryAxis.labels.fontName = 'Helvetica'
    chart.categoryAxis.labels.fontSize = 9

    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(data) + 1 if max(data) > 0 else 5
    chart.valueAxis.labels.fontName = 'Helvetica'
    chart.valueAxis.labels.fontSize = 9

    # Color bars
    chart.bars.strokeColor = colors.black
    chart.bars.strokeWidth = 0.5
    for i in range(len(data)):
        chart.bars[(0, i)].fillColor = colors.HexColor('#1976D2')

    # Add title
    title = String(225, 270, 'Service Distribution', textAnchor='middle')
    title.fontName = 'Helvetica-Bold'
    title.fontSize = 14

    drawing.add(chart)
    drawing.add(title)

    return drawing


def create_exploit_availability_chart(vulnerabilities):
    """
    Create pie chart showing exploit availability

    Args:
        vulnerabilities: list of dicts (will check for exploit links in full data)

    Returns:
        Drawing object
    """
    drawing = Drawing(400, 250)

    # For now, create a simple chart showing exploitable vs non-exploitable
    # This will be enhanced when we parse exploit links from TXT
    exploitable = sum(1 for v in vulnerabilities if v.get('severity') in ['critical', 'high'])
    non_exploitable = len(vulnerabilities) - exploitable

    if exploitable == 0 and non_exploitable == 0:
        exploitable = 0
        non_exploitable = 1

    # Create pie chart
    pie = Pie()
    pie.x = 100
    pie.y = 50
    pie.width = 150
    pie.height = 150
    pie.data = [exploitable, non_exploitable]
    pie.labels = [str(exploitable), str(non_exploitable)]
    pie.slices.strokeWidth = 1
    pie.slices.strokeColor = colors.white

    pie.slices[0].fillColor = colors.HexColor('#D32F2F')  # Exploitable - Red
    pie.slices[1].fillColor = colors.HexColor('#388E3C')  # Not Exploitable - Green

    for i in range(2):
        pie.slices[i].labelRadius = 1.2
        pie.slices[i].fontColor = colors.black
        pie.slices[i].fontSize = 12
        pie.slices[i].fontName = 'Helvetica-Bold'

    # Add legend
    legend = Legend()
    legend.x = 280
    legend.y = 100
    legend.dx = 8
    legend.dy = 8
    legend.fontName = 'Helvetica'
    legend.fontSize = 10
    legend.columnMaximum = 2
    legend.alignment = 'right'
    legend.colorNamePairs = [
        (colors.HexColor('#D32F2F'), f'High Risk: {exploitable}'),
        (colors.HexColor('#388E3C'), f'Low Risk: {non_exploitable}')
    ]

    # Add title
    title = String(200, 220, 'Exploitability Assessment', textAnchor='middle')
    title.fontName = 'Helvetica-Bold'
    title.fontSize = 14

    drawing.add(pie)
    drawing.add(legend)
    drawing.add(title)

    return drawing