import type { CartItemConfiguration } from "@/types/cart";

type Props = {
    configuration: CartItemConfiguration;
    className?: string;
    variant?: "text" | "chips";
};

export function ConfigurationDetails({ configuration, className = "", variant = "text" }: Props) {
    const choices = [...configuration.options, ...configuration.components];

    const groups = choices.reduce<Record<string, typeof choices>>((result, choice) => {
        const groupName = choice.groupName ?? "Opções";

        result[groupName] ??= [];
        result[groupName].push(choice);

        return result;
    }, {});

    const displayGroups = [
        ...Object.entries(groups).map(([name, items]) => ({
            name,
            items,
        })),
        ...(configuration.addons.length > 0
            ? [{ name: "Adicionais", items: configuration.addons }]
            : []),
    ];

    function formatChoice(choice: { name: string; quantity: number }) {
        return choice.quantity > 1 ? `${choice.quantity}x ${choice.name}` : choice.name;
    }

    if (variant === "chips") {
        return (
            <div className={`space-y-3 ${className}`}>
                {displayGroups.map((group) => (
                    <div key={group.name} className="space-y-1.5">
                        <p className="text-muted-foreground text-xs font-medium">{group.name}</p>

                        <div className="flex flex-wrap gap-1.5">
                            {group.items.map((choice, index) => (
                                <span
                                    key={`${choice.id}-${index}`}
                                    className="bg-muted rounded-md px-2.5 py-1 text-xs"
                                >
                                    {formatChoice(choice)}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}

                {configuration.notes && (
                    <p className="text-muted-foreground text-xs">
                        <span className="font-medium">Observação:</span> {configuration.notes}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={`space-y-1 text-sm ${className}`}>
            {displayGroups.map((group) => (
                <p key={group.name}>
                    <span className="font-medium">{group.name}: </span>

                    <span className="text-muted-foreground">
                        {group.items.map(formatChoice).join(", ")}
                    </span>
                </p>
            ))}

            {configuration.notes && (
                <p>
                    <span className="font-medium">Observação: </span>

                    <span className="text-muted-foreground">{configuration.notes}</span>
                </p>
            )}
        </div>
    );
}
