import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Filter, Plus } from 'lucide-react';
import { ReactNode } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSectionProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder: string;
  }[];
  actions?: ReactNode;
  showAddButton?: boolean;
  onAddClick?: () => void;
  addButtonText?: string;
}

export default function FilterSection({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  actions,
  showAddButton = false,
  onAddClick,
  addButtonText = "Thêm mới"
}: FilterSectionProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        
        {filters.map((filter, index) => (
          <Select key={index} value={filter.value} onValueChange={filter.onChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="flex gap-2">
        {actions}
        {showAddButton && onAddClick && (
          <Button onClick={onAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}