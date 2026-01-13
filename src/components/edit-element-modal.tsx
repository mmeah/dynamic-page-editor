
"use client";

import React from 'react';
import { Save, Link, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageElement, ElementType, PageConfig } from '@/lib/types';
import { LucideIcon, iconList } from '@/lib/icons';

export function EditElementModal({ element, onSave, onCancel, config }: { element: PageElement, onSave: (el: PageElement) => void, onCancel: () => void, config: PageConfig }) {
  const [formData, setFormData] = React.useState(element);
  const [isRatioLocked, setIsRatioLocked] = React.useState(!!element.aspectRatio);
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
      setFormData(prev => ({ ...prev, [field]: undefined }));
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) return;

    if (isRatioLocked && formData.aspectRatio) {
        let newWidth = formData.width;
        let newHeight = formData.height;
        if (field === 'width') {
            newWidth = numValue;
            newHeight = Math.round(numValue / formData.aspectRatio);
        } else { // height
            newHeight = numValue;
            newWidth = Math.round(numValue * formData.aspectRatio);
        }
        setFormData(prev => ({...prev, width: newWidth, height: newHeight}));
    } else {
        const newFormData = {...formData, [field]: numValue};
        const {width, height} = newFormData;
        const newAspectRatio = width && height ? width / height : undefined;
        setFormData({...newFormData, aspectRatio: newAspectRatio});
    }
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
          <DialogDescription>
            Click cancel to undo changes, or save to apply settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {formData.type === ElementType.Image && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="src" className="text-right">Image URL</Label>
                  <Input id="src" value={formData.src || ''} onChange={e => handleChange('src', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Dimensions</Label>
                <div className="col-span-3 flex items-center justify-start gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="width">W</Label>
                    <Input id="width" type="number" value={formData.width || ''} onChange={e => handleDimensionChange('width', e.target.value)} className="w-24" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsRatioLocked(prev => !prev)}>
                    {isRatioLocked ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="height">H</Label>
                    <Input id="height" type="number" value={formData.height || ''} onChange={e => handleDimensionChange('height', e.target.value)} className="w-24" />
                  </div>
                </div>
                {/* Hidden image to get natural dimensions for aspect ratio */}
                {formData.src && <img src={formData.src} onLoad={updateAspectRatio} style={{display: 'none'}} alt="hidden for aspect ratio" />}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="refreshInterval" className="text-right">Refresh Interval</Label>
                  <Input id="refreshInterval" type="number" value={formData.refreshInterval || ''} onChange={e => handleChange('refreshInterval', parseInt(e.target.value, 10))} className="col-span-3" placeholder="in seconds, 0 = no refresh" />
              </div>
            </>
          )}

          {(formData.type === ElementType.Text || formData.type === ElementType.Button) && <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="text" className="text-right">Text</Label>
            <Input id="text" value={formData.text || ''} onChange={e => handleChange('text', e.target.value)} className="col-span-3" />
          </div>}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="url" className="text-right">Click URL</Label>
            <Input id="url" value={formData.url || ''} onChange={e => handleChange('url', e.target.value)} className="col-span-3" placeholder={formData.type === ElementType.Text ? "Optional: URL for navigation" : "Optional: REST API endpoint"}/>
          </div>
          
          {(formData.type === ElementType.Button || formData.type === ElementType.Icon) && (
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
          
          {(formData.type === ElementType.Text || formData.type === ElementType.Icon || formData.type === ElementType.Button) && 
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <Input id="color" type="color" value={formData.color || '#000000'} onChange={e => handleChange('color', e.target.value)} className="col-span-3 p-1" />
            </div>
          }


          {(formData.type === ElementType.Text || formData.type === ElementType.Icon || formData.type === ElementType.Button) && (
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
