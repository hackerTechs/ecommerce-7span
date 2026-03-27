import { Button } from "../ui";

export type CartQuantityControlsSize = "sm" | "md";

export interface CartQuantityControlsProps {
  quantity: number;
  maxQuantity: number;
  minQuantity?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove?: () => void;
  size?: CartQuantityControlsSize;
  className?: string;
  disabled?: boolean;
}

const sizeConfig: Record<
  CartQuantityControlsSize,
  { btn: string; value: string; iconBtn: string }
> = {
  sm: {
    btn: "h-8 w-8 shrink-0 rounded p-0 text-lg leading-none !min-h-0 !min-w-0",
    value: "w-8 text-center text-sm font-medium tabular-nums shrink-0",
    iconBtn: "h-8 w-8 shrink-0 rounded-lg p-0 !min-h-0 !min-w-0",
  },
  md: {
    btn: "h-10 w-10 shrink-0 rounded-lg p-0 text-lg leading-none !min-h-0 !min-w-0",
    value: "w-10 text-center font-medium tabular-nums shrink-0",
    iconBtn: "h-10 w-10 shrink-0 rounded-lg p-0 !min-h-0 !min-w-0",
  },
};

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function CartQuantityControls({
  quantity,
  maxQuantity,
  minQuantity = 1,
  onIncrement,
  onDecrement,
  onRemove,
  size = "sm",
  className = "",
  disabled = false,
}: CartQuantityControlsProps) {
  const s = sizeConfig[size];
  const atMin = quantity <= minQuantity;
  const atMax = quantity >= maxQuantity;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={onDecrement}
        disabled={disabled || atMin}
        className={s.btn}
        aria-label="Decrease quantity"
      >
        −
      </Button>
      <span className={s.value}>{quantity}</span>
      <Button
        type="button"
        variant="outline"
        onClick={onIncrement}
        disabled={disabled || atMax}
        className={s.btn}
        aria-label="Increase quantity"
      >
        +
      </Button>
      {onRemove ? (
        <Button
          type="button"
          variant="dangerSoft"
          onClick={onRemove}
          disabled={disabled}
          className={s.iconBtn}
          aria-label="Remove from cart"
        >
          <TrashIcon />
        </Button>
      ) : null}
    </div>
  );
}
