from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from lxml import etree as ET
from pathlib import Path
import re
p='http://schemas.openxmlformats.org/presentationml/2006/main'
mc='http://schemas.openxmlformats.org/markup-compatibility/2006'
p159='http://schemas.microsoft.com/office/powerpoint/2015/09/main'
p14='http://schemas.microsoft.com/office/powerpoint/2010/main'
def tag(ns,local): return '{'+ns+'}'+local
with ZipFile('animated.pptx') as source, ZipFile('candidate.pptx','w', ZIP_DEFLATED) as dest:
    for entry in source.infolist():
        data=source.read(entry)
        m=re.fullmatch(r'ppt/slides/slide(\d+)\.xml',entry.filename)
        if m:
            n=int(m[1])
            root=ET.fromstring(data)
            old=root.find(tag(p,'transition'))
            assert old is not None
            parent=old.getparent()
            at=parent.index(old)
            parent.remove(old)
            wrapper=ET.Element(tag(mc,'AlternateContent'),nsmap={'mc':mc,'p159':p159,'p14':p14})
            modern=ET.SubElement(wrapper,tag(mc,'Choice'),Requires='p159' if n in (7,9) else 'p14')
            transition=ET.SubElement(modern,tag(p,'transition'))
            transition.set(tag(p14,'dur'),'500')
            if n in (7,9): ET.SubElement(transition,tag(p159,'morph'),option='byObject')
            elif n in (3,15): ET.SubElement(transition,tag(p,'zoom'),dir='in')
            else: ET.SubElement(transition,tag(p,'fade'))
            fallback=ET.SubElement(wrapper,tag(mc,'Fallback'))
            old.set('spd','fast')
            fallback.append(old)
            parent.insert(at,wrapper)
            assert root.find(tag(p,'timing')) is not None
            data=ET.tostring(root,encoding='UTF-8',xml_declaration=True,standalone=True)
        dest.writestr(entry,data)

