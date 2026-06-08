import { setDogActive } from "@/actions/dogs";
import { SubmitButton } from "./SubmitButton";
import { ConfirmButton } from "./ConfirmButton";

export function DogActiveToggle({ dogId, active }: { dogId: string; active: boolean }) {
  if (active) {
    return (
      <ConfirmButton
        action={setDogActive}
        fields={{ dogId, active: "0" }}
        variant="danger"
        title="Desactivar perro"
        message="¿Desactivar este perfil de perro? Dejará de aparecer en la app."
        confirmLabel="Desactivar"
      >
        Desactivar
      </ConfirmButton>
    );
  }

  return (
    <form action={setDogActive}>
      <input type="hidden" name="dogId" value={dogId} />
      <input type="hidden" name="active" value="1" />
      <SubmitButton variant="success">Reactivar</SubmitButton>
    </form>
  );
}
