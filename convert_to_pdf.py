#!/usr/bin/env python3
"""
Convert NeuroLearn Markdown Report to PDF using reportlab
"""

import sys
import re
from pathlib import Path

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.pdfgen import canvas
except ImportError:
    print("Installing reportlab...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.pdfgen import canvas

def markdown_to_pdf(md_file, pdf_file):
    """Convert markdown file to PDF"""
    
    try:
        # Read markdown file
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            pdf_file,
            pagesize=A4,
            rightMargin=20,
            leftMargin=20,
            topMargin=20,
            bottomMargin=20
        )
        
        # Container for PDF elements
        story = []
        
        # Create custom styles
        styles = getSampleStyleSheet()
        
        # Custom style for headings
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a73e8'),
            spaceAfter=12,
            spaceBefore=12,
            alignment=0
        )
        
        heading2_style = ParagraphStyle(
            'CustomHeading2',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1a73e8'),
            spaceAfter=8,
            spaceBefore=8
        )
        
        heading3_style = ParagraphStyle(
            'CustomHeading3',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#2d7beb'),
            spaceAfter=6,
            spaceBefore=6
        )
        
        body_style = styles['BodyText']
        body_style.fontSize = 10
        body_style.leading = 14
        
        bullet_style = ParagraphStyle(
            'BulletStyle',
            parent=styles['Normal'],
            fontSize=10,
            leftIndent=20,
            spaceAfter=4
        )
        
        # Parse markdown and add to story
        lines = content.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            if not stripped:
                story.append(Spacer(1, 0.1*inch))
                i += 1
                continue
            
            # Handle main title
            if stripped.startswith('# ') and not stripped.startswith('## '):
                title_text = stripped[2:].strip()
                story.append(Paragraph(title_text, title_style))
                story.append(Spacer(1, 0.15*inch))
                i += 1
                
            # Handle heading 2
            elif stripped.startswith('## ') and not stripped.startswith('### '):
                heading_text = stripped[3:].strip()
                story.append(Paragraph(heading_text, heading2_style))
                story.append(Spacer(1, 0.1*inch))
                i += 1
                
            # Handle heading 3
            elif stripped.startswith('### ') and not stripped.startswith('#### '):
                heading_text = stripped[4:].strip()
                story.append(Paragraph(heading_text, heading3_style))
                story.append(Spacer(1, 0.05*inch))
                i += 1
                
            # Handle bullet points
            elif stripped.startswith('- ') or stripped.startswith('* '):
                bullet_text = stripped[2:].strip()
                story.append(Paragraph(f"&bull; {bullet_text}", bullet_style))
                i += 1
                
            # Handle horizontal rule
            elif stripped.startswith('---') or stripped.startswith('***'):
                story.append(Spacer(1, 0.1*inch))
                story.append(Paragraph("<hr/>", body_style))
                story.append(Spacer(1, 0.1*inch))
                i += 1
                
            # Skip table markers for now - process as regular text
            elif '|' in stripped and i > 0 and ('|' in lines[i-1] or i < len(lines)-1 and '|' in lines[i+1]):
                i += 1
                
            # Regular paragraph
            else:
                # Clean up markdown formatting
                clean_text = stripped
                clean_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', clean_text)
                clean_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', clean_text)
                clean_text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', clean_text)
                
                if clean_text:
                    story.append(Paragraph(clean_text, body_style))
                    story.append(Spacer(1, 0.05*inch))
                
                i += 1
        
        # Build PDF
        doc.build(story)
        print(f"✅ PDF generated successfully!")
        print(f"📄 Report saved to: {pdf_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    md_file = r"c:\Users\azizb\Downloads\Neurolearn\NEUROLEARN_PROJECT_REPORT.md"
    pdf_file = r"c:\Users\azizb\Downloads\Neurolearn\NEUROLEARN_PROJECT_REPORT.pdf"
    
    success = markdown_to_pdf(md_file, pdf_file)
    sys.exit(0 if success else 1)
