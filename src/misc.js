export function setShiny(actor) {
	actor.getProperty().setAmbient(0.3);
	actor.getProperty().setDiffuse(1.0);
	actor.getProperty().setSpecular(1.0);
	actor.getProperty().setSpecularPower(40.0);
	actor.getProperty().setSpecularColor(1.0, 1.0, 1.0);
}

export function setTransparent(bool, actor, opacity) {
	if(bool)
		actor.getProperty().setOpacity(opacity);
	else
		actor.getProperty().setOpacity(1.0);
}