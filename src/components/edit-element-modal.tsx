
"use client";

import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PageElement, PageConfig } from '@/lib/types';
import { LucideIcon, iconList } from '@/lib/icons';

export function EditElementModal({ element, onSave, onCancel, config }: { element: PageElement, onSave: (el: PageElement) => void, onCancel: () => void, config: PageConfig }) {
  const [formData, setFormData] = React.useState(element);
  const selectedIconRef = React.useRef<HTMLButtonElement>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredIcons = React.useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.replace(/\s/g, '').toLowerCase();
    if (!normalizedSearch) {
      return iconList;
    }
    return iconList.filter(iconName =>
      iconName.toLowerCase().includes(normalizedSearch)
    );
  }, [debouncedSearchTerm]);


  React.useEffect(() => {
    if (selectedIconRef.current) {
      selectedIconRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [filteredIcons, formData.icon]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleChange = (field: keyof PageElement, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  }

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: undefined, aspectRatio: prev.aspectRatio }));
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) return;

    let newWidth = formData.width;
    let newHeight = formData.height;
    const aspectRatio = formData.aspectRatio;

    if (field === 'width') {
      newWidth = numValue;
      if (aspectRatio) {
        newHeight = Math.round(numValue / aspectRatio);
      }
    } else { // height
      newHeight = numValue;
      if (aspectRatio) {
        newWidth = Math.round(numValue * aspectRatio);
      }
    }
    setFormData(prev => ({...prev, width: newWidth, height: newHeight}));
  };

  const updateAspectRatio = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const aspectRatio = naturalWidth / naturalHeight;
    setFormData(prev => ({
      ...prev,
      aspectRatio,
      width: prev.width === undefined ? naturalWidth : prev.width,
      height: prev.height === undefined ? naturalHeight : prev.height,
     }));
  };
  
  const fontOptions = [
    { value: "'Poppins', sans-serif", label: "Poppins (Headline)" },
    { value: "'PT Sans', sans-serif", label: "PT Sans (Body)" },
    { value: "Arial, Helvetica, sans-serif", label: "Arial" },
    { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
    { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
    { value: "'Trebuchet MS', Helvetica, sans-serif", label: "Trebuchet MS" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "'Courier New', Courier, monospace", label: "Courier New" },
  ];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {element.type}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {formData.type === 'image' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="src" className="text-right">Image URL</Label>
                  <Input id="src" value={formData.src || ''} onChange={e => handleChange('src', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="width" className="text-right">Width</Label>
                  <Input id="width" type="number" value={formData.width || ''} onChange={e => handleDimensionChange('width', e.target.value)} className="col-span-1" />
                  <Label htmlFor="height" className="text-center col-span-1">Height</Label>
                  <Input id="height" type="number" value={formData.height || ''} onChange={e => handleDimensionChange('height', e.target.value)} className="col-span-1" />
                  {/* Hidden image to get natural dimensions for aspect ratio */}
                  <img src={formData.src} onLoad={updateAspectRatio} style={{display: 'none'}} alt="hidden for aspect ratio" />
              </div>
            </>
          )}

          {(formData.type === 'text' || formData.type === 'button') && <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="text" className="text-right">Text</Label>
            <Input id="text" value={formData.text || ''} onChange={e => handleChange('text', e.target.value)} className="col-span-3" />
          </div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">Click URL</Label>
            <Input id="url" value={formData.url || ''} onChange={e => handleChange('url', e.target.value)} className="col-span-3" placeholder="Optional: REST API endpoint"/>
          </div>
          
          {(formData.type === 'button' || formData.type === 'icon' || formData.type === 'text') && (
             <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="icon" className="text-right pt-2">Icon</Label>
                <div className="col-span-3">
                    {formData.icon && (
                      <div className="mb-2 p-2 bg-muted rounded-md flex items-center gap-2">
                        <LucideIcon name={formData.icon} className="h-6 w-6" />
                        <span className="text-sm font-medium">{formData.icon}</span>
                      </div>
                    )}
                     <div className="mb-2">
                        <Input 
                            placeholder="Search icons..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-48 rounded-lg border shadow-inner">
                      <div className="p-2 grid grid-cols-6 gap-2">
                          {filteredIcons.length > 0 ? filteredIcons.map((iconName) => {
                              const isSelected = formData.icon === iconName;
                              return (
                              <Button
                                  key={iconName}
                                  ref={isSelected ? selectedIconRef : null}
                                  variant={isSelected ? 'secondary' : 'ghost'}
                                  onClick={() => handleChange('icon', iconName)}
                                  className="h-auto p-2 flex flex-col items-center justify-center gap-1"
                              >
                                  <LucideIcon name={iconName} className="h-6 w-6" />
                                  <span className="text-xs w-full text-center truncate">{iconName}</span>
                              </Button>
                              );
                          }) : (
                            <p className="col-span-6 text-center text-sm text-muted-foreground p-4">No icons found.</p>
                          )}
                      </div>
                    </ScrollArea>
                </div>
            </div>
          )}
          
          {(formData.type === 'text' || formData.type === 'icon' || formData.type === 'button') && 
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <Input id="color" type="color" value={formData.color || '#000000'} onChange={e => handleChange('color', e.target.value)} className="col-span-3 p-1" />
            </div>
          }


          {(formData.type === 'text' || formData.type === 'icon' || formData.type === 'button') && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fontSize" className="text-right">Font Size</Label>
                <Input id="fontSize" type="number" value={formData.fontSize || ''} onChange={e => handleChange('fontSize', parseInt(e.target.value, 10))} className="col-span-3" />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fontFamily" className="text-right">Font Family</Label>
                <Select value={formData.fontFamily} onValueChange={(val) => handleChange('fontFamily', val)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value} style={{fontFamily: font.value}}>
                            {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
