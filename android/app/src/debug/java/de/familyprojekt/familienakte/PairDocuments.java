package de.familyprojekt.familienakte;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract.Document;
import android.provider.DocumentsContract.Root;
import android.provider.DocumentsProvider;
import de.familyprojekt.tresor.DateiAblage;
import de.familyprojekt.tresor.TresorOrdner;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

/** Debug-only real SAF filesystem. Seeds an empty invented vault, never sends or acknowledges. */
public final class PairDocuments extends DocumentsProvider {
 private File root;
 private static final String ROOT_ID="pair";
 private static final String[] DOC={Document.COLUMN_DOCUMENT_ID,Document.COLUMN_DISPLAY_NAME,Document.COLUMN_MIME_TYPE,Document.COLUMN_SIZE,Document.COLUMN_FLAGS};
 @Override public boolean onCreate(){
  root=new File(getContext().getFilesDir(),"pair-proof-vault");root.mkdirs();
  try {if(!new File(root,"tresorordner.json").exists())try(TresorOrdner ignored=TresorOrdner.anlegen(new DateiAblage(root),"familienakte","Pair-Probe-2026-only")){};return true;}
  catch(IOException error){throw new IllegalStateException("Empty invented vault failed",error);}
 }
 private File file(String id)throws FileNotFoundException{
  try{
   if(id.equals(ROOT_ID))return root;
   if(!id.startsWith(ROOT_ID+"/"))throw new IOException();
   File f=new File(root,id.substring(ROOT_ID.length()+1)).getCanonicalFile();
   if(!f.getPath().startsWith(root.getCanonicalPath()+File.separator))throw new IOException();return f;
  }catch(IOException error){throw new FileNotFoundException("Invalid document ID");}
 }
 private void row(MatrixCursor c,String id)throws FileNotFoundException{
  File f=file(id);if(!f.exists())throw new FileNotFoundException();MatrixCursor.RowBuilder row=c.newRow();
  for(String col:c.getColumnNames())switch(col){
   case Document.COLUMN_DOCUMENT_ID:row.add(id);break;
   case Document.COLUMN_DISPLAY_NAME:row.add(id.equals(ROOT_ID)?"Pro-Paarprüfung":f.getName());break;
   case Document.COLUMN_MIME_TYPE:row.add(f.isDirectory()?Document.MIME_TYPE_DIR:"application/octet-stream");break;
   case Document.COLUMN_SIZE:row.add(f.length());break;
   case Document.COLUMN_FLAGS:row.add(f.isDirectory()?Document.FLAG_DIR_SUPPORTS_CREATE:Document.FLAG_SUPPORTS_WRITE|Document.FLAG_SUPPORTS_DELETE|Document.FLAG_SUPPORTS_RENAME);break;
   default:row.add(null);
  }
 }
 @Override public Cursor queryRoots(String[] projection){
  MatrixCursor c=new MatrixCursor(projection==null?new String[]{Root.COLUMN_ROOT_ID,Root.COLUMN_TITLE,Root.COLUMN_DOCUMENT_ID,Root.COLUMN_FLAGS,Root.COLUMN_AVAILABLE_BYTES}:projection);
  MatrixCursor.RowBuilder row=c.newRow();for(String col:c.getColumnNames())switch(col){
   case Root.COLUMN_ROOT_ID:row.add(ROOT_ID);break;case Root.COLUMN_TITLE:row.add("Pro-Paarprüfung");break;
   case Root.COLUMN_DOCUMENT_ID:row.add(ROOT_ID);break;case Root.COLUMN_FLAGS:row.add(Root.FLAG_SUPPORTS_CREATE|Root.FLAG_SUPPORTS_IS_CHILD);break;
   case Root.COLUMN_AVAILABLE_BYTES:row.add(root.getUsableSpace());break;default:row.add(null);
  }return c;
 }
 @Override public Cursor queryDocument(String id,String[] projection)throws FileNotFoundException{MatrixCursor c=new MatrixCursor(projection==null?DOC:projection);row(c,id);return c;}
 @Override public Cursor queryChildDocuments(String parent,String[] projection,String sort)throws FileNotFoundException{MatrixCursor c=new MatrixCursor(projection==null?DOC:projection);File[] files=file(parent).listFiles();if(files==null)throw new FileNotFoundException();for(File f:files)row(c,parent+"/"+f.getName());return c;}
 @Override public ParcelFileDescriptor openDocument(String id,String mode,CancellationSignal signal)throws FileNotFoundException{return ParcelFileDescriptor.open(file(id),ParcelFileDescriptor.parseMode(mode));}
 @Override public String createDocument(String parent,String mime,String name)throws FileNotFoundException{
  if(name.isEmpty()||name.equals(".")||name.equals("..")||name.contains("/")||name.contains("\\"))throw new FileNotFoundException();
  String id=parent+"/"+name;File f=file(id);try{if(Document.MIME_TYPE_DIR.equals(mime)?!f.mkdir():!f.createNewFile())throw new IOException();}catch(IOException error){throw new FileNotFoundException();}return id;
 }
 @Override public void deleteDocument(String id)throws FileNotFoundException{if(id.equals(ROOT_ID)||!file(id).delete())throw new FileNotFoundException();}
 @Override public String renameDocument(String id,String name)throws FileNotFoundException{if(id.equals(ROOT_ID)||name.isEmpty()||name.contains("/")||name.contains("\\"))throw new FileNotFoundException();String next=id.substring(0,id.lastIndexOf('/')+1)+name;if(!file(id).renameTo(file(next)))throw new FileNotFoundException();return next;}
 @Override public boolean isChildDocument(String parent,String child){return child.startsWith(parent+"/");}
}
