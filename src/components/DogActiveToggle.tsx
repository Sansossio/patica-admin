import { setDogActive } from "@/actions/dogs";
import { SubmitButton } from "./SubmitButton";

export function DogActiveToggle({ dogId, active }: { dogId: string; active: boolean }) {
  return (
    <form action={setDogActive}>
      <input type="hidden" name="dogId" value={dogId} />
      <input type="hidden" name="active" value={active ? "0" : "1"} />
      {active ? (
        <SubmitButton variant="danger" confirm="¿Desactivar este perfil de perro? Dejará de aparecer en la app.">
          Desactivar
        </SubmitButton>
      ) : (
        <SubmitButton variant="success">Reactivar</SubmitButton>
      )}
    </form>
  );
}
