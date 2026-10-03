/* Authored records, not evidence that their authors are living NPCs. */
(function(root){
'use strict';
const arcs=[
 {id:'doors',title:'La porte qu’on garde',types:[['townhall','bunker'],['warehouse','garage']],mission:'Retrouver pourquoi le dépôt a été gardé ouvert.',choice:{question:'Comment transmettre le registre des passages ?',options:[['public','Afficher les règles communes','Le registre des passages sera affiché au dépôt. Les noms privés restent masqués.'],['reserve','Conserver une copie à la relève','La relève conservera les consignes. Les documents nominatifs restent au registre.']]},records:[
  ['note','Une clé sur le tableau','Billet du dépôt · Luc, agent municipal','La clé de D-17 est sur le tableau, sous les gants. Nous gardons le dépôt ouvert tant qu’un retour reste possible. Si vous prenez mon quart, comptez les personnes, pas les véhicules.'],
  ['papier','L’ordre et sa marge','Copie administrative · signatures effacées','Ordre : verrouiller les locaux techniques. Dans la marge : le dépôt accueille déjà des familles. Les responsables demandent une porte surveillée et un passage de repli. La réponse n’est pas jointe.'],
  ['journal','Le dernier quart connu','Journal de quart · Luc','J’ai laissé le double de la clé dans la boîte sèche, à l’entrée. Le convoi repart sans nous. Nous ne tenons pas une frontière : nous gardons un endroit où revenir. La page suivante est vierge.']
 ]},
 {id:'water',title:'L’eau compte deux fois',types:[['grocer','market'],['cabin','house']],mission:'Suivre les marques de distribution sans confondre réserve et eau potable.',records:[
  ['papier','Deux colonnes','Bordereau rapporté à D-17 · Aline','À boire / à laver. Les deux colonnes doivent rester séparées. Personne n’a contrôlé les citernes depuis la coupure. Un récipient plein n’est pas une garantie.'],
  ['note','La craie sur les bidons','Note de comptoir · Aline','Les bidons marqués d’un trait servent au nettoyage. Ceux marqués de deux traits ont été traités ce matin. Demain, recommencez. Ne réutilisez pas la marque sans refaire le travail.'],
  ['journal','Le jardin fermé','Carnet domestique · auteur inconnu','Nous avons cessé de remplir la petite piscine. L’eau nourrit le jardin et nettoie les outils. La bouteille sur la table est pour notre voisine ; personne n’est venu la chercher.']
 ]},
 {id:'grid',title:'Une lampe au retour',types:[['hardware','garage'],['sawmill','warehouse']],mission:'Reconstituer les consignes du dernier délestage.',records:[
  ['note','Ne pas tout allumer','Consigne recopiée au dépôt · Émile','Gardez une lumière au retour des équipes. Le groupe tourne, mais le carburant doit aussi permettre le prochain démarrage. La lumière attire ceux que nous attendons et ceux que nous craignons.'],
  ['papier','Le fusible manquant','Inventaire d’atelier · Émile','Une pince isolée, trois câbles utilisables, aucun fusible compatible. Le tableau n’est pas réparé. Celui qui lira ceci doit contrôler le circuit avant de tourner la clé.'],
  ['transcription','Quart de nuit, copie écrite','Transcription retrouvée · émission locale non datée','« J’ai coupé la grande halle. On garde la lampe de service. Si vous arrivez et qu’elle est éteinte, attendez de reconnaître les voix avant d’entrer. » La copie s’arrête là ; aucun son d’origine n’est conservé.']
 ]},
 {id:'road',title:'Le trajet sans horaire',types:[['fuel','motel'],['garage','diner']],mission:'Rapprocher deux feuilles de route ; aucun passage actuel n’est garanti.',records:[
  ['papier','Le retour non promis','Feuille de route conservée à D-17 · Oumar','Je dépose les derniers passagers, puis je regarde les accès vers l’est. Ne fixez pas d’heure de retour pour moi. Si le moteur s’arrête, je marcherai.'],
  ['note','Pompe hors service','Billet glissé dans une pochette · Oumar','La pompe ne démarre plus. Le réservoir du véhicule nous amènera au prochain abri, pas au terminus. Le bidon rouge est vide : laissez-le ici pour éviter un faux espoir.'],
  ['journal','La liste au pare-soleil','Carnet de conducteur · Oumar','Nous avons rejoint l’atelier à pied. Je recopie les lieux où nous sommes réellement passés. Les noms barrés indiquent un détour ancien ; ils ne disent rien de la route aujourd’hui.']
 ]},
 {id:'neighbors',title:'Ceux du même palier',types:[['school','apartments'],['house','duplex']],mission:'Rassembler les copies d’un cahier de voisinage, sans déclarer ses auteurs sauvés.',records:[
  ['journal','Les noms protégés','Copie de cahier déposée à D-17 · Solène','Nous avons séparé les noms des adresses. Les consignes peuvent circuler, pas les détails de chaque famille. Si quelqu’un demande où nous sommes partis, ne donnez que ce que vous savez.'],
  ['papier','Salle trois','Liste d’accueil · Solène','Salle trois : couchages prêts. Salle quatre : réserve, ne pas s’y installer. Les absents gardent leur place jusqu’à la relève. Ensuite, noter qui prend la décision.'],
  ['note','Deux coups, puis attendre','Mot sous une porte · auteur inconnu','Elle entend mal du côté de la rue. Frappez deux fois, attendez, puis recommencez. Si elle ne répond pas, appelez quelqu’un qui la connaît. Nous n’avons pas laissé d’adresse de départ.']
 ]},
 {id:'care',title:'La colonne des faits',types:[['clinic','hospital'],['hotel','motel']],mission:'Comparer les fiches de soin sans inventer de diagnostic ni de guérison.',records:[
  ['papier','Une relève à préparer','Fiche de liaison conservée au dépôt · Héloïse','Date, blessure observée, geste réalisé, matériel dépensé. Laissez une ligne vide quand vous ne savez pas. La relève doit comprendre ce que vous avez fait, pas deviner ce que vous espériez.'],
  ['transcription','Une voix recopiée','Transcription d’une liaison sanitaire · Héloïse','« Nous changeons de bâtiment. Le dispensaire manque de place et de lumière. N’envoyez personne sans vérifier l’accès. » La transcription ne contient ni fréquence utilisable ni enregistrement sonore.'],
  ['journal','Le lit près de la porte','Carnet de relève · Héloïse','Le couchage près de la porte reste libre pour une arrivée. Nous n’avons pas de réponse des autres équipes. Sur la fiche, j’ai remplacé “évacué” par “parti avec accompagnement”. Ce n’est pas la même chose.']
 ]},
 {id:'quarry',title:'Sous la poussière',types:[['quarry','mine'],['sawmill','warehouse']],mission:'Suivre la chaîne d’un chantier interrompu ; les matériaux restants sont des réserves finies.',records:[
  ['note','Le camion qui manque','Commande non soldée de D-17 · atelier','Le chargement était destiné au second passage du dépôt. Rien n’a été livré. Ne tracez pas le chantier comme terminé parce que la facture porte un tampon.'],
  ['papier','Chargement arrêté','Feuille de pesée · Basile','Le pont-bascule s’est arrêté avant la seconde pesée. J’ai posé les cales. Aucun chargement ne doit repartir sans contrôle ; le poids indiqué plus haut concerne un autre camion.'],
  ['journal','La pièce gardée','Carnet d’atelier · Basile','J’ai réservé une pièce pour remettre la pompe en route. Le chantier attendra. Celui qui viendra après nous devra choisir encore : réparer l’outil ou prendre son métal.']
 ]},
 {id:'radio',title:'Qui répond au relais',types:[['townhall','school'],['bunker','warehouse']],mission:'Vérifier les traces d’un relais ancien avant de recopier sa promesse.',choice:{question:'Que conserver de la liaison ?',options:[['facts','Transmettre les faits datés','Le carnet de liaison ne transmettra que des lieux visités et des faits datés.'],['uncertain','Conserver aussi les appels incertains','Les appels non vérifiés seront conservés dans une colonne séparée, clairement signalée.']]},records:[
  ['note','La feuille des appels','Registre de D-17 · transmission','Nous écrivons les appels qui nous parviennent. Une voix n’indique ni une position sûre ni un trajet libre. Demandez la date, le lieu et ce que la personne a réellement vu.'],
  ['transcription','Il reste une place','Copie d’un appel ancien · voix non identifiée','« Il reste une place sous le préau. Nous relevons les noms jusqu’à la nuit. » La date manque. Ce message décrit une proposition passée ; aucun refuge actuel n’est confirmé.'],
  ['journal','Le relais sans réponse','Journal de permanence · transmission','Nous avons répété l’appel, puis attendu. Aucune réponse certaine. D-17 reste notre point de retour. Le carnet doit laisser une place aux inconnus sans transformer le silence en promesse.']
 ]}
];
const records=arcs.flatMap(arc=>arc.records.map(([kind,title,source,text],index)=>Object.freeze({id:arc.id+'-'+index,arc:arc.id,index,kind,title,source,text,types:index?arc.types[index-1]:null})));
const scenes=Object.freeze({
 return:{title:'D-17 · Le premier retour',lines:['Le chargement est posé. Les mains sont libres pour bâtir.','Le dépôt ne tiendra que si quelqu’un revient le défendre.']},
 road:{title:'AU-DELÀ DES GRILLES',lines:['La route continue ; le bastion ne s’arrête pas avec vous.','Gardez du temps et des réserves pour le trajet du retour.']},
 dawn:{title:'APRÈS LA MIGRATION',lines:['Le centre tient encore. Les morts ne réparent rien.','Comptez les vivants, les brèches et ce qu’il reste au dépôt.']}
});
const voices=Object.freeze([
 Object.freeze({id:'lea',name:'Léa',arc:'road',title:'Les kilomètres du retour',text:'« Je compte les retours, pas les kilomètres. Mon premier trajet était court ; j’avais pourtant dépensé toute ma force avant de revenir. Depuis, je regarde aussi la route dans l’autre sens. »'}),
 Object.freeze({id:'samir',name:'Samir',arc:'care',title:'Ce que la fiche ne dit pas',text:'« Avant, je remplissais une fiche à la fin de chaque intervention. Maintenant je l’écris dès que je peux. Quand on manque de bras, une phrase claire peut éviter de refaire le mauvais geste. »'}),
 Object.freeze({id:'ines',name:'Inès',arc:'grid',title:'La pièce du lendemain',text:'« J’ai déjà démonté une machine pour en sauver une autre. Sur le moment, cela semblait évident. Le lendemain, il fallait de nouveau choisir. Garder une pièce pour plus tard, c’est aussi réparer. »'}),
 Object.freeze({id:'malik',name:'Malik',arc:'doors',title:'La place derrière soi',text:'« Ma première garde, je regardais seulement devant. On m’a demandé où je reculerais. Je n’avais rien prévu. Depuis, je vérifie le passage derrière moi avant de prendre position. »'})
]);
const api=Object.freeze({arcs:Object.freeze(arcs.map(Object.freeze)),records:Object.freeze(records),scenes,voices});
root.DeadwallChronicles131Data=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
