import type { CartItemConfiguration } from "@/types/cart";

type Props = {
    configuration: CartItemConfiguration;
    className?: string;
};

export function ConfigurationDetails({ configuration, className = "" }: Props) {
    const choices = [...configuration.options, ...configuration.components];

    const groups = choices.reduce<Record<string, typeof choices>>((result, choice) => {
        const groupName = choice.groupName ?? "Opções";

        result[groupName] ??= [];
        result[groupName].push(choice);

        return result;
    }, {});

    function formatChoices(items: { name: string; quantity: number }[]) {
        return items
            .map((item) => (item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name))
            .join(", ");
    }

    return (
        <div className={`space-y-1 text-sm ${className}`}>
            {Object.entries(groups).map(([name, items]) => (
                <p key={name}>
                    <span className="font-medium">{name}: </span>
                    <span className="text-muted-foreground">{formatChoices(items)}</span>
                </p>
            ))}

            {configuration.addons.length > 0 && (
                <p>
                    <span className="font-medium">Adicionais: </span>
                    <span className="text-muted-foreground">
                        {formatChoices(configuration.addons)}
                    </span>
                </p>
            )}

            {configuration.notes && (
                <p>
                    <span className="font-medium">Observação: </span>
                    <span className="text-muted-foreground">{configuration.notes}</span>
                </p>
            )}
        </div>
    );
}
