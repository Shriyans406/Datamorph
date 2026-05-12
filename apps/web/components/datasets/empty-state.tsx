interface Props {
    title: string
    description: string
}

export function EmptyState({
    title,
    description,
}: Props) {
    return (
        <div className="border rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold">
                {title}
            </h2>

            <p className="text-muted-foreground mt-2">
                {description}
            </p>
        </div>
    )
}